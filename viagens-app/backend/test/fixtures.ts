// Respostas de exemplo no formato da documentação oficial de cada fornecedor
// (SerpApi: exemplo da página Google Flights/Hotels; Duffel: tipos do SDK oficial @duffel/api).

export const serpFlights = {
  search_metadata: { status: "Success", created_at: "2026-11-25 10:00:00 UTC", google_flights_url: "https://www.google.com/travel/flights?hl=pt-BR" },
  best_flights: [
    {
      flights: [
        { departure_airport: { name: "Aeroporto Internacional Pinto Martins", id: "FOR", time: "2026-12-10 06:05" }, arrival_airport: { name: "Aeroporto de Guarulhos", id: "GRU", time: "2026-12-10 09:35" }, duration: 210, airplane: "Airbus A320", airline: "LATAM", travel_class: "Econômica", flight_number: "LA 3401", extensions: ["Bagagem de mão incluída"] },
      ],
      total_duration: 210,
      carbon_emissions: { this_flight: 152000 },
      price: 1610,
      type: "Ida e volta",
      departure_token: "TOKEN_IDA_1",
    },
  ],
  other_flights: [
    {
      flights: [
        { departure_airport: { name: "Aeroporto Internacional Pinto Martins", id: "FOR", time: "2026-12-10 05:00" }, arrival_airport: { name: "Aeroporto de Brasília", id: "BSB", time: "2026-12-10 07:40" }, duration: 160, airline: "GOL", flight_number: "G3 1500" },
        { departure_airport: { name: "Aeroporto de Brasília", id: "BSB", time: "2026-12-10 09:10" }, arrival_airport: { name: "Aeroporto de Guarulhos", id: "GRU", time: "2026-12-10 10:55" }, duration: 105, airline: "GOL", flight_number: "G3 1720", overnight: false },
      ],
      layovers: [{ duration: 90, name: "Aeroporto de Brasília", id: "BSB" }],
      total_duration: 355,
      price: 1100,
      type: "Ida e volta",
      departure_token: "TOKEN_IDA_2",
    },
  ],
  price_insights: { lowest_price: 1100, price_level: "typical", typical_price_range: [950, 1700] },
};

export const serpReturn = {
  other_flights: [
    {
      flights: [{ departure_airport: { name: "Aeroporto de Guarulhos", id: "GRU", time: "2026-12-17 18:00" }, arrival_airport: { name: "Aeroporto Internacional Pinto Martins", id: "FOR", time: "2026-12-17 21:20" }, duration: 200, airline: "LATAM", flight_number: "LA 3402" }],
      total_duration: 200,
      price: 1610,
      booking_token: "TOKEN_COMPRA_1",
    },
  ],
};

export const serpBooking = {
  booking_options: [
    { together: { book_with: "Decolar", price: 1590, baggage_prices: ["1 bagagem de mão grátis"], booking_request: { url: "https://www.google.com/travel/clk/f", post_data: "u=abc" } } },
    { together: { book_with: "LATAM", airline: true, price: 1610, option_title: "Light", extensions: ["Sem reembolso"], baggage_prices: ["1 bagagem de mão grátis", "1ª mala despachada: 150"], booking_request: { url: "https://www.google.com/travel/clk/f", post_data: "u=def" } } },
  ],
};

export const serpHotels = {
  search_metadata: { google_hotels_url: "https://www.google.com/travel/search?q=Paris" },
  properties: [
    {
      type: "hotel",
      name: "Hotel Exemplo Paris",
      link: "https://www.hotel-exemplo.fr",
      gps_coordinates: { latitude: 48.86, longitude: 2.34 },
      check_in_time: "15:00",
      check_out_time: "11:00",
      rate_per_night: { lowest: "R$ 800", extracted_lowest: 800 },
      total_rate: { lowest: "R$ 4.000", extracted_lowest: 4000 },
      prices: [{ source: "Booking.com", rate_per_night: { extracted_lowest: 800 } }],
      nearby_places: [{ name: "Museu do Louvre", transportations: [{ type: "A pé", duration: "8 min" }] }],
      extracted_hotel_class: 4,
      images: [{ thumbnail: "https://exemplo/t.jpg", original_image: "https://exemplo/o.jpg" }],
      overall_rating: 4.5,
      reviews: 1234,
      location_rating: 4.8,
      amenities: ["Wi-Fi grátis", "Café da manhã grátis"],
      property_token: "PT1",
    },
    { type: "vacation rental", name: "Apartamento sem preço", amenities: [], excluded_amenities: ["Café da manhã"] },
  ],
};

const airport = (code: string, name: string) => ({ iata_code: code, name, city_name: name });
export function duffelOffer(live: boolean, amount = "1234.50") {
  return {
    id: `off_${live ? "live" : "test"}`,
    total_amount: amount,
    total_currency: "BRL",
    expires_at: "2026-11-25T12:00:00Z",
    live_mode: live,
    owner: { name: "LATAM Airlines Brasil", iata_code: "LA" },
    total_emissions_kg: "150",
    conditions: { refund_before_departure: { allowed: false }, change_before_departure: { allowed: true, penalty_amount: "200.00", penalty_currency: "BRL" } },
    passengers: [{ id: "pas_1", type: "adult" }],
    slices: [
      {
        origin: airport("FOR", "Fortaleza"),
        destination: airport("GRU", "Guarulhos"),
        duration: "PT5H55M",
        fare_brand_name: "Standard",
        segments: [
          { departing_at: "2026-12-10T05:00:00", arriving_at: "2026-12-10T07:40:00", origin: airport("FOR", "Fortaleza"), destination: airport("BSB", "Brasília"), duration: "PT2H40M", marketing_carrier: { name: "LATAM", iata_code: "LA" }, marketing_carrier_flight_number: "3500", operating_carrier: { name: "LATAM", iata_code: "LA" }, passengers: [{ baggages: [{ type: "carry_on", quantity: 1 }, { type: "checked", quantity: 1 }] }] },
          { departing_at: "2026-12-10T09:10:00", arriving_at: "2026-12-10T10:55:00", origin: airport("BSB", "Brasília"), destination: airport("GRU", "Guarulhos"), duration: "PT1H45M", marketing_carrier: { name: "LATAM", iata_code: "LA" }, marketing_carrier_flight_number: "3600", operating_carrier: { name: "LATAM", iata_code: "LA" }, passengers: [{ baggages: [] }] },
        ],
      },
    ],
  };
}
