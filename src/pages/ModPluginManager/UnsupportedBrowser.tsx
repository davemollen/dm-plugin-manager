export function UnsupportedBrowser() {
  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wide">Unsupported browser.</h3>
      <p className="mt-4 text-base">
        Alternatively you can also use the terminal to transfer plugins from
        your system to your MOD. Follow these steps:
      </p>
      <ol className="mt-2 list-inside list-decimal">
        <li>Open the terminal</li>
        <li>
          Type in the following:
          <div className="ml-7">
            <span className="bg-codebox my-1 flex rounded-md p-2 text-background">
              {"scp -O -rp <path-to-.lv2> root@moddwarf.local:/root/.lv2/"}
            </span>
            This will copy the folder from your system to your MOD. Make sure
            you replace {"<path-to-lv2>"} with the correct folder location.
          </div>
        </li>
        <li>Reboot your MOD and your plugin will be available.</li>
      </ol>
    </div>
  );
}
