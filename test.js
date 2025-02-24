// const { FloatApi } = require("sec-api");

// const floatApi = new FloatApi(
//   "115b6d3609620195269ad7073eab1984f6085725649952361f7bc55fc12d340f"
// );

// async function getFloatData(ticker) {
//   try {
//     const response = await floatApi.get_float(ticker);
//     console.log(response.data);
//   } catch (error) {
//     console.error("Error fetching float data:", error);
//   }
// }

// // Example usage
// getFloatData("GOOGL");

const apiKey =
  "115b6d3609620195269ad7073eab1984f6085725649952361f7bc55fc12d340f";

async function getFloatData(ticker) {
  try {
    const ticker = "CETX";
    const res = await fetch(`https://api.sec-api.io/float?ticker=${ticker}`, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    }).then((res) => res.json());
    console.log(res.data[0].float, res.data[1].float);
  } catch (error) {
    console.error("Error fetching float data:", error);
  }
}

getFloatData("GOOGL");
