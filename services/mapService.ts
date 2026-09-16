export const buscarCentrosMedicos =
  async (
    lat: number,
    lng: number
  ) => {
    try {
      const url = `
https://nominatim.openstreetmap.org/search?format=json&q=hospital&limit=15&viewbox=${
        lng - 0.2
      },${lat + 0.2},${
        lng + 0.2
      },${lat - 0.2}
`;

      const response = await fetch(
        url,
        {
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      return data;
    } catch (error) {
      console.log(error);

      return [];
    }
  };