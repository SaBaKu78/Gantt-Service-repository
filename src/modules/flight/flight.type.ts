export type FlightDirection = 'ARRIVAL' | 'DEPARTURE'

export type FlightStatus =
  | 'SCHEDULED'
  | 'BOARDING'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'CANCELLED'
  | 'DELAYED'

export interface Flight {
  id: number

  airportCode: string
  flightNo: string
  operationDate: string

  direction: FlightDirection

  airlineCode?: string
  aircraftNo?: string
  aircraftType?: string

  originAirport?: string
  destinationAirport?: string

  scheduledDepartureTime?: string | null
  scheduledArrivalTime?: string | null

  estimatedDepartureTime?: string | null
  estimatedArrivalTime?: string | null

  actualDepartureTime?: string | null
  actualArrivalTime?: string | null

  terminal?: string
  gate?: string
  stand?: string

  status: FlightStatus

  passengerCount?: number
  baggageCount?: number

  sourceSystem?: string
  externalId?: string

  version: number

  extra: Record<string, unknown>

  createdAt: string
  updatedAt: string
}