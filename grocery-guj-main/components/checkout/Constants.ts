// Delivery time options
export const deliveryTimes = [
  { id: '1', time: 'As soon as possible', estimate: '30-45 minutes' },
  { id: '2', time: 'Schedule for later', estimate: 'Choose time' },
];

// Predefined delivery time slots with better organization
export const timeSlots = [
  { id: '1', label: 'Today, 2:00 PM - 3:00 PM', day: 'today', start: '14:00', end: '15:00' },
  { id: '2', label: 'Today, 4:00 PM - 5:00 PM', day: 'today', start: '16:00', end: '17:00' },
  { id: '3', label: 'Today, 6:00 PM - 7:00 PM', day: 'today', start: '18:00', end: '19:00' },
  { id: '4', label: 'Tomorrow, 10:00 AM - 11:00 AM', day: 'tomorrow', start: '10:00', end: '11:00' },
  { id: '5', label: 'Tomorrow, 12:00 PM - 1:00 PM', day: 'tomorrow', start: '12:00', end: '13:00' },
  { id: '6', label: 'Tomorrow, 2:00 PM - 3:00 PM', day: 'tomorrow', start: '14:00', end: '15:00' },
];

export const sectionOffsets = {
  address: 0,
  payment: 300,
  delivery: 600,
  coupon: 900,
  order: 1200
}; 