-- Demo data: accounts for every role plus trips in every status, offers, chat and reviews.
-- Every demo login uses the password Demo1234! and an @demo.test email.
-- Run in the Supabase SQL Editor after schema.sql. Safe to run again: it wipes and
-- recreates the trips owned by demo customers, and never touches real (Google) users.

-- ---------------------------------------------------------------------------
-- Helpers (pg_temp: they disappear when the session ends)
-- ---------------------------------------------------------------------------

create or replace function pg_temp.demo_user(p_email text, p_name text)
returns uuid
language plpgsql
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      p_email, extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_name), now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), uid, uid::text, 'email',
      jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
      now(), now(), now()
    );
  end if;

  -- Inserted as customer: the protect_profile trigger forbids other roles on insert.
  insert into public.profiles (id, role, full_name, locale)
  values (uid, 'customer', p_name, 'th')
  on conflict (id) do nothing;
  return uid;
end;
$$;

-- Updates run without auth.uid(), so protect_profile lets role and verification change here.
create or replace function pg_temp.demo_companion(
  p_email text, p_name text, p_phone text, p_bio text, p_years int,
  p_skills text[], p_provinces text[], p_days text[],
  p_from time, p_to time, p_min numeric, p_status text
) returns uuid
language plpgsql
as $$
declare
  uid uuid := pg_temp.demo_user(p_email, p_name);
begin
  update public.profiles set
    role = 'companion', full_name = p_name, phone = p_phone, bio = p_bio,
    experience_years = p_years, skills = p_skills, service_provinces = p_provinces,
    available_days = p_days, available_from = p_from, available_to = p_to,
    min_compensation = p_min, verification_status = p_status,
    verification_note = case when p_status = 'rejected' then 'ข้อมูลยืนยันตัวตนไม่ครบ กรุณาส่งใหม่' end
  where id = uid;
  return uid;
end;
$$;

create or replace function pg_temp.demo_customer(p_email text, p_name text, p_phone text, p_bio text)
returns uuid
language plpgsql
as $$
declare
  uid uuid := pg_temp.demo_user(p_email, p_name);
begin
  update public.profiles set role = 'customer', full_name = p_name, phone = p_phone, bio = p_bio,
    verification_status = 'not_required'
  where id = uid;
  return uid;
end;
$$;

create or replace function pg_temp.demo_trip(
  p_customer uuid, p_companion uuid, p_status text, p_category text,
  p_title text, p_details text,
  p_origin text, p_olat float8, p_olng float8, p_oprov text,
  p_dest text, p_dlat float8, p_dlng float8, p_dprov text,
  p_day_offset int, p_time time, p_hours numeric, p_pay numeric
) returns uuid
language sql
as $$
  insert into public.trips (
    customer_id, companion_id, status, category, title, details,
    origin_label, origin_lat, origin_lng, origin_province,
    destination_label, destination_lat, destination_lng, destination_province,
    scheduled_date, start_time, duration_hours, offered_compensation, created_at
  ) values (
    p_customer, p_companion, p_status, p_category, p_title, p_details,
    p_origin, p_olat, p_olng, p_oprov,
    p_dest, p_dlat, p_dlng, p_dprov,
    current_date + p_day_offset, p_time, p_hours, p_pay,
    -- Past trips were posted a few days before they happened; future ones recently.
    now() - make_interval(days => greatest(3, 3 - p_day_offset))
  )
  returning id;
$$;

create or replace function pg_temp.demo_chat(p_trip uuid, p_customer uuid, p_companion uuid, p_lines text[])
returns void
language plpgsql
as $$
declare
  i int;
  base timestamptz := (select created_at from public.trips where id = p_trip) + interval '1 day';
begin
  -- Odd lines are the customer, even lines the companion.
  for i in 1 .. array_length(p_lines, 1) loop
    insert into public.messages (trip_id, sender_id, body, created_at)
    values (p_trip, case when i % 2 = 1 then p_customer else p_companion end, p_lines[i],
            base + make_interval(mins => i * 7));
  end loop;
end;
$$;

create or replace function pg_temp.demo_review(p_trip uuid, p_from uuid, p_to uuid, p_rating int, p_comment text)
returns void
language sql
as $$
  insert into public.reviews (trip_id, reviewer_id, reviewee_id, rating, comment)
  values (p_trip, p_from, p_to, p_rating, p_comment);
$$;

-- ---------------------------------------------------------------------------
-- Data
-- ---------------------------------------------------------------------------

do $$
declare
  -- main demo logins
  admin_id uuid;
  cust uuid;     -- customer@demo.test
  comp uuid;     -- companion@demo.test
  -- companions
  c_nok uuid; c_ton uuid; c_ploy uuid; c_bank uuid; c_fah uuid; c_arm uuid; c_mint uuid;
  c_pending1 uuid; c_pending2 uuid; c_rejected uuid;
  -- customers
  u_somsri uuid; u_prasert uuid; u_malee uuid; u_wichai uuid; u_jiraporn uuid; u_anan uuid; u_suspended uuid;
  t uuid;
  all_days text[] := array['sun','mon','tue','wed','thu','fri','sat'];
  weekdays text[] := array['mon','tue','wed','thu','fri'];
begin
  -- Accounts ----------------------------------------------------------------
  admin_id := pg_temp.demo_user('admin@demo.test', 'แอดมินเดโม');
  update public.profiles set role = 'admin', phone = '0800000001', bio = 'ผู้ดูแลระบบสำหรับทดลอง'
  where id = admin_id;

  cust := pg_temp.demo_customer('customer@demo.test', 'ผู้ขอเดโม', '0800000002',
    'ดูแลคุณแม่อายุ 72 ปี ลูกๆ ทำงานเลยพาไปหาหมอเองไม่ค่อยได้');
  comp := pg_temp.demo_companion('companion@demo.test', 'เพื่อนเดินทางเดโม', '0800000003',
    'เคยทำงานโรงพยาบาลเอกชน 3 ปี คุ้นเคยขั้นตอนเวชระเบียน การเข้าคิว และการรับยา ใจเย็น ขับรถได้',
    3, array['walking','documents','queue','wheelchair'], array['bangkok','nonthaburi'],
    array['mon','tue','wed','thu','fri','sat'], '08:00', '18:00', 300, 'approved');

  c_nok := pg_temp.demo_companion('nok@demo.test', 'นกน้อย ใจดี', '0812345671',
    'อดีตพยาบาลผู้ช่วย ถนัดพาผู้สูงอายุไปตรวจตามนัดและช่วยจดคำแนะนำหมอ', 6,
    array['walking','wheelchair','queue'], array['bangkok','samut-prakan'], all_days, '07:00', '17:00', 350, 'approved');
  c_ton := pg_temp.demo_companion('ton@demo.test', 'ต้นกล้า มั่นคง', '0812345672',
    'นักศึกษาปริญญาโท ว่างช่วงบ่ายและเสาร์อาทิตย์ ชำนาญเรื่องเอกสารราชการและธนาคาร', 2,
    array['documents','queue','language'], array['bangkok','pathum-thani'], array['sat','sun','wed'], '12:00', '20:00', 250, 'approved');
  c_ploy := pg_temp.demo_companion('ploy@demo.test', 'พลอยใส รักษ์ดี', '0812345673',
    'พูดอังกฤษและจีนได้ ช่วยลูกค้าต่างชาติและผู้สูงอายุติดต่อโรงพยาบาลเอกชน', 4,
    array['language','documents','walking'], array['bangkok'], weekdays, '09:00', '18:00', 400, 'approved');
  c_bank := pg_temp.demo_companion('bank@demo.test', 'แบงก์ ขยันยิ่ง', '0812345674',
    'มีรถเก๋งส่วนตัว ช่วยพาขึ้นลงรถ ถือของ ไปห้างและตลาดได้', 5,
    array['shopping','walking','wheelchair'], array['nonthaburi','bangkok'], array['mon','wed','fri','sat','sun'], '08:00', '19:00', 300, 'approved');
  c_fah := pg_temp.demo_companion('fah@demo.test', 'ฟ้าใส ศรีสุข', '0812345675',
    'อยู่เชียงใหม่ ช่วยพาไปโรงพยาบาลมหาราชและสวนดอก รู้จักเส้นทางดี', 3,
    array['walking','queue','shopping'], array['chiang-mai'], all_days, '08:00', '17:00', 250, 'approved');
  c_arm := pg_temp.demo_companion('arm@demo.test', 'อาร์ม พากเพียร', '0812345676',
    'อาสาสมัครกู้ภัยเก่า ใจเย็น ดูแลผู้ใช้วีลแชร์ได้ อยู่ขอนแก่น', 7,
    array['wheelchair','walking','queue'], array['khon-kaen'], weekdays, '07:30', '16:30', 280, 'approved');
  c_mint := pg_temp.demo_companion('mint@demo.test', 'มิ้นท์ มีสุข', '0812345677',
    'อยู่หาดใหญ่ ช่วยติดต่อธนาคาร ประกันสังคม และพาไปตลาดกิมหยง', 2,
    array['documents','shopping','queue'], array['songkhla'], array['tue','thu','sat','sun'], '09:00', '18:00', 250, 'approved');
  c_pending1 := pg_temp.demo_companion('pending1@demo.test', 'สมศักดิ์ รอตรวจ', '0812345678',
    'เพิ่งสมัคร เคยดูแลคุณพ่อที่ป่วยติดเตียง 2 ปี', 2,
    array['wheelchair','walking'], array['bangkok'], all_days, '08:00', '20:00', 300, 'pending');
  c_pending2 := pg_temp.demo_companion('pending2@demo.test', 'วรรณา ขอสมัคร', '0812345679',
    'แม่บ้านว่างช่วงกลางวัน อยู่นนทบุรี ขับรถได้', 1,
    array['shopping','queue'], array['nonthaburi'], weekdays, '09:00', '15:00', 200, 'pending');
  c_rejected := pg_temp.demo_companion('rejected@demo.test', 'ทดสอบ ไม่ผ่าน', '0812345680',
    'โปรไฟล์ตัวอย่างที่แอดมินไม่อนุมัติ', 0,
    array['queue'], array['bangkok'], array['sat'], '10:00', '12:00', 500, 'rejected');

  u_somsri := pg_temp.demo_customer('somsri@demo.test', 'สมศรี วงศ์ใหญ่', '0891112221', 'อายุ 68 ปี เป็นเบาหวาน ต้องไปตรวจทุกเดือน');
  u_prasert := pg_temp.demo_customer('prasert@demo.test', 'ประเสริฐ ทองดี', '0891112222', 'ข้าราชการเกษียณ ใช้ไม้เท้า');
  u_malee := pg_temp.demo_customer('malee@demo.test', 'มาลี สายใจ', '0891112223', 'ลูกสาวจองให้คุณแม่ อยู่ต่างจังหวัด');
  u_wichai := pg_temp.demo_customer('wichai@demo.test', 'วิชัย ใจกล้า', '0891112224', 'ใช้วีลแชร์หลังผ่าตัดเข่า');
  u_jiraporn := pg_temp.demo_customer('jiraporn@demo.test', 'จิราพร นาคสวัสดิ์', '0891112225', 'อยู่เชียงใหม่ ตาไม่ค่อยดี');
  u_anan := pg_temp.demo_customer('anan@demo.test', 'อนันต์ ศรีเมือง', '0891112226', 'อยู่ขอนแก่น ต้องทำเรื่องบัตรผู้สูงอายุ');
  u_suspended := pg_temp.demo_customer('suspended@demo.test', 'บัญชี ถูกระงับ', '0891112227', 'ตัวอย่างบัญชีที่แอดมินระงับ');
  update public.profiles set account_status = 'suspended' where id = u_suspended;

  -- Emergency contacts (only visible to the companion on a live trip).
  insert into public.emergency_contacts (user_id, name, relation, phone) values
    (cust, 'สมชาย ใจดี', 'ลูกชาย', '0899999999'),
    (u_somsri, 'สุดา วงศ์ใหญ่', 'ลูกสาว', '0898888888'),
    (u_wichai, 'วิภา ใจกล้า', 'ภรรยา', '0897777777')
  on conflict (user_id) do update set name = excluded.name, relation = excluded.relation, phone = excluded.phone;

  -- Start clean: remove every trip a demo customer owns (offers, chat, reviews cascade).
  delete from public.trips where customer_id in (
    select p.id from public.profiles p join auth.users u on u.id = p.id where u.email like '%@demo.test'
  );

  -- customer@demo.test: one trip in every status --------------------------------
  t := pg_temp.demo_trip(cust, null, 'open', 'hospital',
    'พาคุณแม่ไปตรวจเลือดและพบหมอเบาหวาน',
    'คุณแม่ต้องงดอาหารก่อนตรวจ ช่วยพาเข้าคิวเจาะเลือด รอพบแพทย์ และรับยา มีวีลแชร์พับได้ติดไปด้วย',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'โรงพยาบาลรามาธิบดี', 13.7661, 100.5266, 'bangkok', 4, '07:00', 4, 1200);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status, created_at) values
    (t, c_nok, 'companion', 'สวัสดีค่ะ เคยพาคนไข้ไปรามาหลายครั้ง รู้ขั้นตอนเจาะเลือดค่ะ', 'pending', now() - interval '20 hours'),
    (t, c_ploy, 'companion', 'ว่างวันนั้นค่ะ ไปรับที่คอนโดได้เลย', 'pending', now() - interval '6 hours'),
    (t, comp, 'customer', '', 'pending', now() - interval '2 hours');

  t := pg_temp.demo_trip(cust, null, 'open', 'bank',
    'ไปธนาคารเปลี่ยนสมุดบัญชีและทำบัตร ATM ใหม่',
    'บัตรหาย ต้องแจ้งอายัดและทำบัตรใหม่ ช่วยกรอกเอกสารให้หน่อย',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'ธนาคารกรุงไทย สาขาเซ็นทรัลลาดพร้าว', 13.8166, 100.5613, 'bangkok', 9, '10:30', 2, 500);

  t := pg_temp.demo_trip(cust, comp, 'matched', 'government',
    'ต่ออายุบัตรประชาชนที่สำนักงานเขต',
    'บัตรหมดอายุเดือนหน้า ต้องไปทำที่เขตจตุจักร เดินไกลไม่ค่อยไหว',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'สำนักงานเขตจตุจักร', 13.8285, 100.5597, 'bangkok', 2, '09:00', 2, 600);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'companion', 'รับงานนี้ได้ครับ เคยพาไปทำบัตรที่เขตนี้แล้ว', 'accepted'),
    (t, c_ton, 'companion', 'ว่างครับ', 'declined');
  perform pg_temp.demo_chat(t, cust, comp, array[
    'สวัสดีค่ะ ขอบคุณที่รับงานนะคะ',
    'ยินดีครับ วันนั้นผมไปรับที่คอนโด 8:40 นะครับ',
    'ได้ค่ะ ต้องเตรียมเอกสารอะไรบ้างคะ',
    'บัตรประชาชนใบเดิมกับทะเบียนบ้านตัวจริงครับ',
    'โอเคค่ะ แล้วเจอกันนะคะ'
  ]);

  t := pg_temp.demo_trip(cust, comp, 'in_progress', 'doctor',
    'ตรวจตาตามนัดที่ศูนย์จักษุ',
    'หมอจะหยอดยาขยายม่านตา หลังตรวจมองไม่ค่อยชัด ช่วยพากลับบ้านด้วย',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'โรงพยาบาลราชวิถี', 13.7650, 100.5370, 'bangkok', 0, '08:30', 3, 900);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'customer', '', 'accepted');
  -- Live trip: last shared location near the hospital and a family link already on.
  update public.trips
    set last_lat = 13.7662, last_lng = 100.5352, last_located_at = now() - interval '4 minutes',
        share_token = 'a1b2c3d4-0000-4000-8000-00000000c0de'
    where id = t;
  perform pg_temp.demo_chat(t, cust, comp, array[
    'ถึงไหนแล้วคะ',
    'ถึงหน้าคอนโดแล้วครับ รออยู่ที่ล็อบบี้',
    'ลงไปแล้วค่ะ',
    'ตอนนี้ยื่นบัตรคิวแล้วนะครับ คิวที่ 42 รอประมาณ 30 นาที'
  ]);

  t := pg_temp.demo_trip(cust, comp, 'completed', 'hospital',
    'ไปรับยาความดันและตรวจติดตามอาการ',
    'นัดหมอประจำ 3 เดือนครั้ง ช่วยจดสิ่งที่หมอแนะนำให้ด้วย',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'โรงพยาบาลจุฬาลงกรณ์', 13.7326, 100.5363, 'bangkok', -12, '08:00', 4, 1000);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'companion', 'รับได้ครับ', 'accepted');
  perform pg_temp.demo_chat(t, cust, comp, array[
    'พรุ่งนี้เจอกัน 7 โมงครึ่งนะคะ',
    'ได้ครับ',
    'วันนี้ขอบคุณมากนะคะ คุณแม่ชมว่าใจเย็นมาก',
    'ยินดีครับ หมอให้ลดเค็มและกลับมาตรวจอีก 3 เดือนนะครับ'
  ]);
  perform pg_temp.demo_review(t, cust, comp, 5, 'ตรงเวลา ใจเย็น จดคำแนะนำหมอให้ละเอียดมาก คุณแม่ประทับใจ');
  perform pg_temp.demo_review(t, comp, cust, 5, 'ลูกค้าเตรียมเอกสารพร้อม นัดหมายชัดเจน');

  t := pg_temp.demo_trip(cust, comp, 'completed', 'shopping',
    'ซื้อของเข้าบ้านที่ตลาด อ.ต.ก.',
    'ซื้อผักผลไม้และของใช้ประจำเดือน ของค่อนข้างเยอะ ช่วยถือหน่อย',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'ตลาด อ.ต.ก.', 13.7988, 100.5487, 'bangkok', -25, '09:00', 2, 450);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'customer', '', 'accepted');
  perform pg_temp.demo_review(t, cust, comp, 4, 'ช่วยถือของดีมาก แต่มาช้านิดหน่อยเพราะรถติด');

  t := pg_temp.demo_trip(cust, null, 'cancelled', 'other',
    'ไปงานบวชหลานที่วัด',
    'ยกเลิกเพราะญาติมารับเองแล้ว',
    'คอนโดลาดพร้าว 71', 13.8030, 100.6046, 'bangkok',
    'วัดพระศรีมหาธาตุ บางเขน', 13.8731, 100.5895, 'bangkok', -5, '06:30', 5, 800);

  -- companion@demo.test: invitations waiting for an answer ------------------------
  t := pg_temp.demo_trip(u_somsri, null, 'open', 'hospital',
    'พาไปตรวจน้ำตาลและตรวจเท้าเบาหวาน',
    'เดินช้า ต้องมีคนช่วยพยุงขึ้นลงบันได',
    'ซอยประชาชื่น 20', 13.8600, 100.5300, 'nonthaburi',
    'โรงพยาบาลนนทเวช', 13.8483, 100.5170, 'nonthaburi', 3, '08:00', 3, 700);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'customer', '', 'pending'),
    (t, c_bank, 'companion', 'อยู่นนทบุรี ใกล้มากครับ', 'pending');

  t := pg_temp.demo_trip(u_prasert, null, 'open', 'bank',
    'ไปธนาคารแก้ไขข้อมูลบัญชีรับบำนาญ',
    'ต้องยื่นหนังสือรับรองจากกรมบัญชีกลาง ช่วยดูเอกสารให้ครบ',
    'หมู่บ้านเสนานิเวศน์', 13.8340, 100.6060, 'bangkok',
    'ธนาคารกรุงไทย สาขาสีลม', 13.7262, 100.5290, 'bangkok', 2, '10:00', 3, 650);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'customer', '', 'pending'),
    (t, c_ton, 'companion', 'ถนัดเรื่องเอกสารธนาคารครับ', 'pending');

  -- companion@demo.test: other jobs across statuses --------------------------------
  t := pg_temp.demo_trip(u_wichai, comp, 'matched', 'hospital',
    'กายภาพบำบัดหลังผ่าตัดเข่า',
    'นั่งวีลแชร์ ต้องช่วยย้ายจากรถขึ้นวีลแชร์',
    'คอนโดริมน้ำ บางซื่อ', 13.8093, 100.5372, 'bangkok',
    'โรงพยาบาลพระมงกุฎเกล้า', 13.7676, 100.5335, 'bangkok', 5, '13:00', 3, 900);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'companion', 'ดูแลผู้ใช้วีลแชร์ได้ครับ', 'accepted');
  perform pg_temp.demo_chat(t, u_wichai, comp, array[
    'รถผมเป็นรถกระบะนะครับ ขึ้นลงลำบากหน่อย',
    'ไม่เป็นไรครับ ผมเตรียมแผ่นรองไปช่วยครับ'
  ]);

  t := pg_temp.demo_trip(u_malee, comp, 'completed', 'government',
    'พาแม่ไปยื่นขอเบี้ยยังชีพผู้สูงอายุ',
    'ลูกสาวอยู่ต่างจังหวัด ฝากพาคุณแม่ไปยื่นเอกสารที่เขต',
    'ซอยพหลโยธิน 24', 13.8110, 100.5670, 'bangkok',
    'ศูนย์ราชการแจ้งวัฒนะ อาคาร B', 13.8828, 100.5654, 'bangkok', -8, '09:30', 3, 750);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'customer', '', 'accepted');
  perform pg_temp.demo_review(t, u_malee, comp, 5, 'ส่งรูปอัปเดตให้ตลอด ทำให้ลูกที่อยู่ไกลสบายใจมาก');
  perform pg_temp.demo_review(t, comp, u_malee, 4, 'ข้อมูลชัดเจนดีครับ');

  t := pg_temp.demo_trip(u_somsri, comp, 'completed', 'doctor',
    'ทำฟันและขูดหินปูน',
    'กลัวหมอฟัน อยากให้มีคนอยู่เป็นเพื่อน',
    'ซอยประชาชื่น 20', 13.8600, 100.5300, 'nonthaburi',
    'คลินิกทันตกรรม เซ็นทรัลแจ้งวัฒนะ', 13.9036, 100.5280, 'nonthaburi', -18, '15:00', 2, 400);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values
    (t, comp, 'companion', '', 'accepted');
  perform pg_temp.demo_review(t, u_somsri, comp, 5, 'คุยเก่ง ทำให้หายตื่นเต้น');

  -- Other companions' work, so ratings and the admin view look lived-in -------------
  t := pg_temp.demo_trip(u_prasert, c_nok, 'completed', 'hospital',
    'ตรวจหัวใจประจำปี', 'ต้องเดินสายพาน ช่วยดูแลหลังตรวจ',
    'หมู่บ้านเสนานิเวศน์', 13.8340, 100.6060, 'bangkok',
    'โรงพยาบาลศิริราช', 13.7593, 100.4851, 'bangkok', -30, '07:30', 5, 1300);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_nok, 'companion', '', 'accepted');
  perform pg_temp.demo_review(t, u_prasert, c_nok, 5, 'มืออาชีพมาก รู้ขั้นตอนโรงพยาบาลดี');

  t := pg_temp.demo_trip(u_wichai, c_nok, 'completed', 'hospital',
    'ตัดไหมหลังผ่าตัด', 'แผลที่เข่า ต้องใช้วีลแชร์',
    'คอนโดริมน้ำ บางซื่อ', 13.8093, 100.5372, 'bangkok',
    'โรงพยาบาลพระมงกุฎเกล้า', 13.7676, 100.5335, 'bangkok', -40, '10:00', 2, 600);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_nok, 'customer', '', 'accepted');
  perform pg_temp.demo_review(t, u_wichai, c_nok, 4, 'ดูแลดี แต่พูดน้อยไปหน่อย');

  t := pg_temp.demo_trip(u_malee, c_ploy, 'completed', 'hospital',
    'พาคุณแม่พบหมอกระดูกที่โรงพยาบาลเอกชน', 'ช่วยสื่อสารกับหมอและเคลมประกัน',
    'ซอยพหลโยธิน 24', 13.8110, 100.5670, 'bangkok',
    'โรงพยาบาลกรุงเทพ', 13.7489, 100.5836, 'bangkok', -15, '11:00', 3, 1100);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_ploy, 'customer', '', 'accepted');
  perform pg_temp.demo_review(t, u_malee, c_ploy, 5, 'ช่วยเรื่องเคลมประกันจนจบ เก่งมาก');

  t := pg_temp.demo_trip(u_somsri, c_bank, 'completed', 'shopping',
    'ซื้อของใช้เข้าบ้านที่ห้าง', 'ของเยอะ มีน้ำดื่มแพ็กใหญ่',
    'ซอยประชาชื่น 20', 13.8600, 100.5300, 'nonthaburi',
    'เซ็นทรัล เวสต์เกต', 13.8764, 100.4113, 'nonthaburi', -9, '14:00', 3, 500);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_bank, 'companion', '', 'accepted');
  perform pg_temp.demo_review(t, u_somsri, c_bank, 5, 'มีรถให้นั่ง สะดวกมาก');

  t := pg_temp.demo_trip(u_prasert, c_ton, 'matched', 'government',
    'ยื่นเอกสารที่สำนักงานประกันสังคม', 'ขอรับสิทธิบำเหน็จชราภาพ',
    'หมู่บ้านเสนานิเวศน์', 13.8340, 100.6060, 'bangkok',
    'สำนักงานประกันสังคม นนทบุรี', 13.8621, 100.5144, 'nonthaburi', 7, '13:30', 3, 600);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_ton, 'companion', 'รับได้ครับ', 'accepted');
  perform pg_temp.demo_chat(t, u_prasert, c_ton, array['สะดวกบ่ายโมงครึ่งไหมครับ', 'สะดวกครับ ผมจะไปรอที่หน้าหมู่บ้าน']);

  t := pg_temp.demo_trip(u_jiraporn, c_fah, 'completed', 'hospital',
    'ตรวจต้อกระจกที่โรงพยาบาลมหาราช', 'มองไม่ค่อยเห็น ช่วยอ่านเอกสารให้ด้วย',
    'ถนนนิมมานเหมินท์ ซอย 13', 18.7960, 98.9680, 'chiang-mai',
    'โรงพยาบาลมหาราชนครเชียงใหม่', 18.7898, 98.9737, 'chiang-mai', -6, '08:00', 4, 800);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_fah, 'customer', '', 'accepted');
  perform pg_temp.demo_review(t, u_jiraporn, c_fah, 5, 'อ่านใบนัดให้ละเอียด ใจดีมากค่ะ');

  t := pg_temp.demo_trip(u_jiraporn, null, 'open', 'bank',
    'ไปธนาคารทำธุรกรรมโอนเงินให้หลาน', 'ต้องยืนยันตัวตนที่สาขา',
    'ถนนนิมมานเหมินท์ ซอย 13', 18.7960, 98.9680, 'chiang-mai',
    'ธนาคารกสิกรไทย สาขากาดสวนแก้ว', 18.7963, 98.9676, 'chiang-mai', 5, '10:00', 2, 350);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_fah, 'companion', 'ใกล้บ้านเลยค่ะ', 'pending');

  t := pg_temp.demo_trip(u_anan, c_arm, 'in_progress', 'government',
    'ทำบัตรผู้สูงอายุและลงทะเบียนสวัสดิการ', 'ใช้วีลแชร์ ต้องมีคนช่วยเข็น',
    'บ้านพักในเมืองขอนแก่น', 16.4300, 102.8350, 'khon-kaen',
    'ศาลากลางจังหวัดขอนแก่น', 16.4419, 102.8360, 'khon-kaen', 0, '09:00', 3, 700);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_arm, 'customer', '', 'accepted');
  perform pg_temp.demo_chat(t, u_anan, c_arm, array['มาถึงแล้วโทรบอกนะครับ', 'ถึงแล้วครับ รออยู่หน้าบ้าน']);

  t := pg_temp.demo_trip(u_anan, c_arm, 'completed', 'hospital',
    'ตรวจตามนัดที่โรงพยาบาลศรีนครินทร์', 'ตรวจเลือดและพบหมอไต',
    'บ้านพักในเมืองขอนแก่น', 16.4300, 102.8350, 'khon-kaen',
    'โรงพยาบาลศรีนครินทร์', 16.4686, 102.8307, 'khon-kaen', -20, '07:00', 5, 900);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_arm, 'companion', '', 'accepted');
  perform pg_temp.demo_review(t, u_anan, c_arm, 5, 'ดูแลเหมือนญาติ');

  t := pg_temp.demo_trip(u_malee, null, 'open', 'shopping',
    'ซื้อของฝากที่ตลาดกิมหยง', 'แม่อยากไปเลือกของเอง เดินได้แต่ช้า',
    'โรงแรมย่านถนนนิพัทธ์อุทิศ', 7.0080, 100.4760, 'songkhla',
    'ตลาดกิมหยง หาดใหญ่', 7.0060, 100.4740, 'songkhla', 10, '10:00', 3, 450);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_mint, 'companion', 'รู้จักร้านอร่อยในตลาดด้วยค่ะ', 'pending');

  t := pg_temp.demo_trip(u_wichai, null, 'open', 'doctor',
    'พบหมอกระดูกติดตามผลผ่าตัด', 'นั่งวีลแชร์ ต้องการคนช่วยย้ายตัว',
    'คอนโดริมน้ำ บางซื่อ', 13.8093, 100.5372, 'bangkok',
    'โรงพยาบาลศิริราช', 13.7593, 100.4851, 'bangkok', 12, '09:00', 4, 1000);

  t := pg_temp.demo_trip(u_prasert, null, 'cancelled', 'hospital',
    'ตรวจสุขภาพประจำปี', 'เลื่อนนัดเพราะหมอติดประชุม',
    'หมู่บ้านเสนานิเวศน์', 13.8340, 100.6060, 'bangkok',
    'โรงพยาบาลรามาธิบดี', 13.7661, 100.5266, 'bangkok', -3, '08:00', 3, 700);
  insert into public.offers (trip_id, companion_id, initiated_by, message, status) values (t, c_nok, 'companion', '', 'withdrawn');

  t := pg_temp.demo_trip(u_suspended, null, 'cancelled', 'other',
    'คำขอจากบัญชีที่ถูกระงับ', 'ตัวอย่างสำหรับหน้าแอดมิน',
    'กรุงเทพฯ', 13.7563, 100.5018, 'bangkok',
    'กรุงเทพฯ', 13.7563, 100.5018, 'bangkok', -2, '12:00', 1, 100);
end $$;

select
  (select count(*) from public.profiles p join auth.users u on u.id = p.id where u.email like '%@demo.test') as demo_profiles,
  (select count(*) from public.trips) as trips,
  (select count(*) from public.offers) as offers,
  (select count(*) from public.messages) as messages,
  (select count(*) from public.reviews) as reviews;
