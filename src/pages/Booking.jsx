import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area"

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
    const now = new Date();
    return Object.entries(bookings)
      .filter(([key, value]) => value === currentUser && parseISO(key.split('-')[0]) >= now)
      .map(([key]) => {
        const [date, time] = key.split('-');
        return { date: parseISO(date), time };
      })
      .sort((a, b) => a.date - b.date);
  };

  const canBookSlot = (slot, date) => {
    const userBookings = getUserBookings();
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(parseInt(slot.split('-')[0]), 0, 0, 0);

    // Check if the selected date and time is in the past
    if (selectedDateTime < new Date()) {
      return false;
    }

    // Check if the user already has a booking for the future
    if (userBookings.length > 0) {
      const earliestBooking = userBookings[0];
      if (isSameDay(date, earliestBooking.date) && slot === earliestBooking.time) {
        return true; // Allow editing the current booking
      }
      return false; // User already has a future booking
    }

    return true; // User has no future bookings, so they can book
  };

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  const handleBooking = (slot, date = selectedDate) => {
    const bookingKey = `${format(date, 'yyyy-MM-dd')}-${slot}`;
    if (isUserBooking(bookingKey)) {
      setDialogAction('unbook');
    } else if (canBookSlot(slot)) {
      setDialogAction('book');
    } else {
      return;
    }
    setSelectedSlot(slot);
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const bookSlot = (slot) => {
    const updatedBookings = { ...bookings };
    const bookingKey = `${format(selectedDate, 'yyyy-MM-dd')}-${slot}`;
  
    if (dialogAction === 'book') {
      // Remove all future bookings for the current user
      Object.keys(updatedBookings).forEach(key => {
        const [bookingDate] = key.split('-');
        if (updatedBookings[key] === currentUser && parseISO(bookingDate) >= new Date()) {
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
    return (
      <div key={slot.full} className="space-y-2">
        <Button
          onClick={() => handleBooking(slot.full)}
          disabled={!canBookSlot(slot.full, selectedDate) && !isUserBooking(slot.full)}
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

  const UserBookings = () => {
    const userBookings = getUserBookings();
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {userBookings.length > 0 ? (
              userBookings.map(({ date, time }, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <span>{format(date, 'MMM d, yyyy')} - {time}</span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBooking(time, date)}
                  >
                    Unbook
                  </Button>
                </div>
              ))
            ) : (
              <p>No current bookings</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Laundry Booking</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
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
        </div>
        <div>
          <UserBookings />
        </div>
      </div>
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
