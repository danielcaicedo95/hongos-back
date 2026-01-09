
try {
    const Service = require("./src/modules/wompi-payment/service").default;
    console.log("Service loaded successfully:", !!Service);
} catch (e) {
    console.error("Failed to load service:", e);
}
