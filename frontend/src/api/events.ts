import client from './client'
import type { CalendarEvent, CreateEventPayload } from '@/types'

export const getEvents = (year: number, month: number) =>
  client.get<CalendarEvent[]>('/events', { params: { year, month } })

export const createEvent = (data: CreateEventPayload) =>
  client.post<CalendarEvent>('/events', data)

export const updateEvent = (id: string, data: Partial<CreateEventPayload> & { user_notes?: string }) =>
  client.put<CalendarEvent>(`/events/${id}`, data)

export const deleteEvent = (id: string) =>
  client.delete<{ message: string }>(`/events/${id}`)

export const completeEvent = (id: string, completed = true) =>
  client.post<CalendarEvent>(`/events/${id}/complete`, { completed })
