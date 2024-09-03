export function UnsupportedBrowser() {
  return (
    <div className="text-sm">
      <h3 className="font-sans text-2xl font-bold tracking-wide">
        Unsupported browser.
      </h3>
      <p className="mt-4">
        Alternatively you can also use the terminal to transfer plugins from
        your system to your MOD. Follow these steps:
      </p>
      <ol className="mt-4 list-inside list-decimal">
        <li className="mt-2">Open the terminal</li>
        <li className="mt-2">
          Type in the following and press enter:
          <div className="ml-7">
            <span className="my-1 flex rounded-md bg-codebox p-2 text-background">
              {"scp -O -rp <path-to-.lv2> root@moddwarf.local:/root/.lv2/"}
            </span>
            This will copy the folder from your system to your MOD. Make sure
            you replace {"<path-to-lv2>"} with the correct folder location.
          </div>
        </li>
        <li className="mt-2">
          Reboot your MOD and the plugin should be available.
        </li>
      </ol>
    </div>
  );
}
