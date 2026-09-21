export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("cc-theme");if(t==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
