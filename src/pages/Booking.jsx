import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addDays, format } from 'date-fns';

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
  const navigate = useNavigate();

  const getUserBookings = () => {
    return Object.entries(bookings)
      .filter(([, value]) => value === currentUser)
      .map(([key]) => key.split('-').slice(1).join('-'));
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
      setBookings({}); // Reset all bookings
    }
  }, [navigate]);

  const handleBooking = (slot) => {
    if (!canBookSlot(slot)) return;
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };

  const bookSlot = (slot) => {
    const updatedBookings = { ...bookings };
    
    // Remove existing bookings for the current user
    Object.keys(updatedBookings).forEach(key => {
      if (updatedBookings[key] === currentUser) {
        delete updatedBookings[key];
      }
    });

    // Add new booking
    updatedBookings[`booking-${slot}`] = currentUser;
  
    setBookings(updatedBookings);
    setIsDialogOpen(false);
  };

  const isSlotBooked = (slot) => {
    return bookings[`booking-${slot}`] !== undefined;
  };

  const isUserBooking = (slot) => {
    return bookings[`booking-${slot}`] === currentUser;
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
    const isFullSlot = slot.length === 5;
    const quickRinseBooked = isFullSlot && slot.quick.some(q => isSlotBooked(q));
    
    if (quickRinseBooked) {
      return (
        <div key={slot.full} className="space-y-2">
          {slot.quick.map(quickSlot => (
            <Button
              key={quickSlot}
              onClick={() => handleBooking(quickSlot)}
              disabled={!canBookSlot(quickSlot) || (isSlotBooked(quickSlot) && !isUserBooking(quickSlot))}
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
            disabled={!canBookSlot(slot.full) || (isSlotBooked(slot.full) && !isUserBooking(slot.full))}
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
  })}
</div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book this time slot?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => bookSlot(selectedSlot)}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Booking;
