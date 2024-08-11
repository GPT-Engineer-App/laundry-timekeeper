import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format, parseISO, isToday, isBefore, startOfDay, isAfter, isValid } from 'date-fns';

const timeSlots = ['7-10', '10-13', '13-16', '16-19', '19-22'];

const Booking = () => {
  const [bookings, setBookings] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
      const storedBookings = JSON.parse(localStorage.getItem('bookings')) || {};
      setBookings(storedBookings);
      updateUpcomingBookings(storedBookings, user);
    }
  }, [navigate]);

  const updateUpcomingBookings = (bookings, user) => {
    const now = new Date();
    const userBookings = Object.entries(bookings)
      .filter(([key, value]) => value === user)
      .map(([key]) => {
        const [dateStr, timeSlot] = key.split('-');
        const [startHour] = timeSlot.split('-');
        const bookingDate = parseISO(dateStr);
        bookingDate.setHours(parseInt(startHour, 10), 0, 0, 0);
        return { date: bookingDate, timeSlot };
      })
      .filter(booking => isAfter(booking.date, now))
      .sort((a, b) => a.date - b.date);
    setUpcomingBookings(userBookings.slice(0, 3)); // Show only the next 3 upcoming bookings
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

  const handleBooking = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    const updatedBookings = { ...bookings };
    
    // Check if the user already has a booking for this day
    const existingBookingKey = Object.keys(updatedBookings).find(key => 
      key.startsWith(dateKey) && updatedBookings[key] === currentUser
    );

    if (existingBookingKey) {
      // Remove existing booking for this day
      delete updatedBookings[existingBookingKey];
    }

    // Add new booking
    updatedBookings[slotKey] = currentUser;
    
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    updateUpcomingBookings(updatedBookings, currentUser);
  };

  const isSlotBooked = (slot) => {
    if (!isValid(selectedDate)) {
      console.error('Invalid selectedDate:', selectedDate);
      return false;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] !== undefined;
  };

  const isUserBooking = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] === currentUser;
  };

  const isSlotAvailable = (slot) => {
    return !isSlotBooked(slot);
  };

  const isSlotPast = (slot) => {
    const [startHour] = slot.split('-');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(startHour, 10), 0, 0, 0);
    return isBefore(slotDate, new Date());
  };

  const hasUserBooking = () => {
    const now = new Date();
    return Object.entries(bookings).some(([key, value]) => {
      if (value === currentUser) {
        const [dateStr] = key.split('-');
        const bookingDate = parseISO(dateStr);
        return isAfter(bookingDate, now) || isToday(bookingDate);
      }
      return false;
    });
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Invalid date:', date);
      return 'Invalid Date';
    }
    return format(date, 'MMMM d, yyyy');
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
          {upcomingBookings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Your Upcoming Bookings:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {upcomingBookings.map((booking, index) => (
                  <Card key={index} className="p-4">
                    <p className="font-medium">{format(booking.date, 'MMMM d, yyyy')}</p>
                    <p>{booking.timeSlot}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || date > addDays(new Date(), 21)}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Bookings for {formatDate(selectedDate)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timeSlots.map((slot) => {
                  const isPast = isSlotPast(slot);
                  const isBooked = isSlotBooked(slot);
                  const isUserSlot = isUserBooking(slot);
                  const isAvailable = isSlotAvailable(slot);
                  const canBook = !isPast && isAvailable && !hasUserBooking();

                  return (
                    <Button
                      key={slot}
                      onClick={() => canBook && handleBooking(slot)}
                      disabled={!canBook}
                      variant={isUserSlot ? "default" : (isAvailable ? "outline" : "secondary")}
                      className={`h-20 ${isUserSlot ? 'bg-green-500 hover:bg-green-600' : ''} ${isPast ? 'opacity-50' : ''}`}
                    >
                      {slot}
                      <br />
                      {isPast ? "Past" : isUserSlot ? "Your Booking" : (isBooked ? "Booked" : (isAvailable ? "Available" : "Unavailable"))}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Booking;
