import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addDays, format, isSameDay } from 'date-fns';

const timeSlots = [
  { full: '7-10', quick: ['7-8', '8-9', '9-10'] },
  { full: '10-13', quick: ['10-11', '11-12', '12-13'] },
  { full: '13-16', quick: ['13-14', '14-15', '15-16'] },
  { full: '16-19', quick: ['16-17', '17-18', '18-19'] },
  { full: '19-22', quick: ['19-20', '20-21', '21-22'] }
];

const Booking = () => {
  const [bookings, setBookings] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('book'); // 'book' or 'unbook'
  const navigate = useNavigate();

  const getUserBookings = () => {
    return Object.entries(bookings)
      .filter(([key, value]) => value === currentUser && key.startsWith(`${format(selectedDate, 'yyyy-MM-dd')}-`))
      .map(([key]) => key.split('-').slice(2).join('-'));
  };

  const canBookSlot = (slot) => {
    const userBookings = getUserBookings();
    const isQuickRinse = slot.length === 5; // e.g., "7-8"
    const hasFullBooking = userBookings.some(booking => booking.length === 5); // e.g., "7-10"
    const hasQuickRinse = userBookings.some(booking => booking.length === 5);

    if (isQuickRinse) {
      return !hasQuickRinse;
    } else {
      return !hasFullBooking && !hasQuickRinse;
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  const handleBooking = (slot) => {
    if (isUserBooking(`${format(selectedDate, 'yyyy-MM-dd')}-${slot}`)) {
      setDialogAction('unbook');
    } else if (canBookSlot(slot)) {
      setDialogAction('book');
    } else {
      return;
    }
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };

  const bookSlot = (slot) => {
    const updatedBookings = { ...bookings };
    const bookingKey = `${format(selectedDate, 'yyyy-MM-dd')}-${slot}`;
    
    if (dialogAction === 'book') {
      // Remove existing bookings for the current user on the selected date
      Object.keys(updatedBookings).forEach(key => {
        if (updatedBookings[key] === currentUser && key.startsWith(`${format(selectedDate, 'yyyy-MM-dd')}-`)) {
          delete updatedBookings[key];
        }
      });

      // Add new booking
      updatedBookings[bookingKey] = currentUser;
    } else if (dialogAction === 'unbook') {
      // Remove the booking
      delete updatedBookings[bookingKey];
    }
  
    setBookings(updatedBookings);
    setIsDialogOpen(false);
  };

  const isSlotBooked = (slot) => {
    return bookings[`${format(selectedDate, 'yyyy-MM-dd')}-${slot}`] !== undefined;
  };

  const isUserBooking = (slot) => {
    return bookings[`${format(selectedDate, 'yyyy-MM-dd')}-${slot}`] === currentUser;
  };

  const getSlotStatus = (slot) => {
    if (isUserBooking(slot)) return "Your Booking";
    if (isSlotBooked(slot)) return "Booked";
    if (!canBookSlot(slot)) return "Not Available";
    return "Available";
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const renderTimeSlot = (slot) => {
    const isFullSlot = slot.full.length === 5;
    const quickRinseBooked = isFullSlot && slot.quick.some(q => isSlotBooked(q));
    
    if (quickRinseBooked) {
      return (
        <div key={slot.full} className="space-y-2">
          {slot.quick.map(quickSlot => (
            <Button
              key={quickSlot}
              onClick={() => handleBooking(quickSlot)}
              disabled={!canBookSlot(quickSlot) && !isUserBooking(quickSlot)}
              variant={isSlotBooked(quickSlot) ? (isUserBooking(quickSlot) ? "default" : "secondary") : "outline"}
              className={`w-full h-12 ${isUserBooking(quickSlot) ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {quickSlot}
              <br />
              {getSlotStatus(quickSlot)}
            </Button>
          ))}
        </div>
      );
    } else {
      return (
        <div key={slot.full} className="space-y-2">
          <Button
            onClick={() => handleBooking(slot.full)}
            disabled={!canBookSlot(slot.full) && !isUserBooking(slot.full)}
            variant={isSlotBooked(slot.full) ? (isUserBooking(slot.full) ? "default" : "secondary") : "outline"}
            className={`w-full h-20 ${isUserBooking(slot.full) ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {slot.full}
            <br />
            {getSlotStatus(slot.full)}
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Laundry Booking</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Book a Laundry Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 21)}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            {timeSlots.map(renderTimeSlot)}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === 'book' ? 'Confirm Booking' : 'Confirm Unbooking'}</DialogTitle>
            <DialogDescription>
              {dialogAction === 'book' 
                ? `Are you sure you want to book this time slot: ${selectedSlot} on ${format(selectedDate, 'MMMM d, yyyy')}?`
                : `Are you sure you want to unbook this time slot: ${selectedSlot} on ${format(selectedDate, 'MMMM d, yyyy')}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => bookSlot(selectedSlot)}>
              {dialogAction === 'book' ? 'Confirm Booking' : 'Confirm Unbooking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Booking;
