import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addDays, format } from 'date-fns';

const timeSlots = [
  { full: '7-10', quick: ['7-8', '9-10'] },
  { full: '10-13', quick: ['10-11', '12-13'] },
  { full: '13-16', quick: ['13-14', '15-16'] },
  { full: '16-19', quick: ['16-17', '18-19'] },
  { full: '19-22', quick: ['19-20', '21-22'] }
];

const Booking = () => {
  const [bookings, setBookings] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const getUserBookings = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return Object.entries(bookings)
      .filter(([key, value]) => key.startsWith(dateKey) && value === currentUser)
      .map(([key]) => key.split('-').slice(3).join('-'));
  };

  const canBookSlot = (slot) => {
    const userBookings = getUserBookings(selectedDate);
    const isQuickRinse = slot.length === 3; // e.g., "7-8"
    const hasFullBooking = userBookings.some(booking => booking.length === 5); // e.g., "7-10"
    const hasQuickRinse = userBookings.some(booking => booking.length === 3);

    if (isQuickRinse) {
      return !hasQuickRinse && !hasFullBooking;
    } else {
      return !hasFullBooking;
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
      const storedBookings = JSON.parse(localStorage.getItem('bookings')) || {};
      setBookings(storedBookings);
    }
  }, [navigate]);

  const handleBooking = (slot) => {
    if (!canBookSlot(slot)) return;

    if (slot.length === 5) { // Full-length slot
      setSelectedSlot(slot);
      setIsDialogOpen(true);
    } else { // Quick rinse slot
      bookSlot(slot);
    }
  };

  const bookSlot = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    const updatedBookings = { ...bookings };
  
    // Remove existing booking of the same type (full or quick) for the current user on the selected date
    Object.keys(updatedBookings).forEach(key => {
      if (key.startsWith(dateKey) && updatedBookings[key] === currentUser) {
        const existingSlot = key.split('-').slice(3).join('-');
        if ((existingSlot.length === 5 && slot.length === 5) || (existingSlot.length === 3 && slot.length === 3)) {
          delete updatedBookings[key];
        }
      }
    });

    // Add new booking
    updatedBookings[slotKey] = currentUser;
  
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    setIsDialogOpen(false);
  };

  const isSlotBooked = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] !== undefined;
  };

  const isUserBooking = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] === currentUser;
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Laundry Room Booking</span>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser}!</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date() || date > addDays(new Date(), 21)}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Bookings for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timeSlots.map((slotGroup) => (
                  <div key={slotGroup.full} className="space-y-2">
                    <Button
                      onClick={() => handleBooking(slotGroup.full)}
                      disabled={!canBookSlot(slotGroup.full) || (isSlotBooked(slotGroup.full) && !isUserBooking(slotGroup.full))}
                      variant={isSlotBooked(slotGroup.full) ? (isUserBooking(slotGroup.full) ? "default" : "secondary") : "outline"}
                      className={`w-full h-20 ${isUserBooking(slotGroup.full) ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {slotGroup.full}
                      <br />
                      {getSlotStatus(slotGroup.full)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Booking Type</DialogTitle>
            <DialogDescription>
              Do you want to book the entire time slot or just a quick rinse?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => bookSlot(selectedSlot)}>Full Slot ({selectedSlot})</Button>
            {selectedSlot && (
              <>
                <Button onClick={() => bookSlot(selectedSlot.split('-')[0])}>
                  Quick Rinse ({selectedSlot.split('-')[0]})
                </Button>
                <Button onClick={() => bookSlot(selectedSlot.split('-')[1])}>
                  Quick Rinse ({selectedSlot.split('-')[1]})
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Booking;
