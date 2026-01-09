
// We need to register ts-node to handle imports
require('ts-node').register();

try {
    const moduleDef = require("./src/modules/wompi-payment/index.ts").default;
    console.log("Module Definition:", moduleDef);
    console.log("Services:", moduleDef ? moduleDef.services : "N/A");
    if (moduleDef && moduleDef.services) {
        moduleDef.services.forEach((s, i) => {
            console.log(`Service ${i}:`, s);
            console.log(`Service ${i} prototype:`, s ? s.prototype : "N/A");
        });
    }
} catch (e) {
    console.error("Error loading module:", e);
}
