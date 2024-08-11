import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { addDays, format, parseISO, isToday, isBefore, startOfDay, isAfter, isValid, isSameDay } from 'date-fns';

const timeSlots = ['7-10', '10-13', '13-16', '16-19', '19-22'];

const Booking = () => {
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
      const allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
      const userBooking = allBookings.find(booking => booking.user === user);
      if (userBooking) {
        setUpcomingBooking(userBooking);
      }
    }
  }, [navigate]);

  const handleDateSelect = (date) => {
    if (date && !isSameDay(date, selectedDate)) {
      setSelectedDate(date);
    }
  };

  const handleBooking = (slot) => {
    if (upcomingBooking && upcomingBooking.timeSlot === slot && isSameDay(parseISO(upcomingBooking.date), selectedDate)) {
      // If clicking on the current booking, do nothing (cancellation is handled separately)
      return;
    }

    const newBooking = {
      user: currentUser,
      date: selectedDate.toISOString(),
      timeSlot: slot
    };
    setUpcomingBooking(newBooking);
    
    // Get all bookings
    let allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    
    // Remove any existing bookings for the current user
    allBookings = allBookings.filter(booking => booking.user !== currentUser);
    
    // Add the new booking
    allBookings.push(newBooking);
    
    // Update all bookings in localStorage
    localStorage.setItem('allBookings', JSON.stringify(allBookings));
    
    // Update user's upcoming booking
    localStorage.setItem('upcomingBooking', JSON.stringify(newBooking));
  };

  const cancelBooking = () => {
    // Remove the booking from allBookings
    let allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    allBookings = allBookings.filter(booking => booking.user !== currentUser);
    localStorage.setItem('allBookings', JSON.stringify(allBookings));

    // Clear the user's upcoming booking
    localStorage.removeItem('upcomingBooking');
    setUpcomingBooking(null);
  };

  const isSlotBooked = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    return bookings.some(booking => 
      format(parseISO(booking.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
      booking.timeSlot === slot
    );
  };

  const isUserBooking = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    return bookings.some(booking => 
      format(parseISO(booking.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
      booking.timeSlot === slot &&
      booking.user === currentUser
    );
  };

  const isSlotAvailable = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    return !bookings.some(booking => 
      format(parseISO(booking.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
      booking.timeSlot === slot &&
      booking.user !== currentUser
    );
  };

  const isSlotPast = (slot) => {
    const [startHour] = slot.split('-');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(startHour, 10), 0, 0, 0);
    return isBefore(slotDate, new Date());
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
      {upcomingBooking && (
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Your Upcoming Booking:</h3>
          <p className="text-lg font-medium">{format(upcomingBooking.date, 'MMMM d, yyyy')} - {upcomingBooking.timeSlot}</p>
        </div>
      )}
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
                onSelect={handleDateSelect}
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
                  const canBook = !isPast && (isAvailable || isUserSlot);

                  return (
                    <AlertDialog key={slot}>
                      <AlertDialogTrigger asChild>
                        <Button
                          onClick={() => {
                            if (isUserSlot) {
                              // Do nothing, let the AlertDialog handle it
                            } else if (!isBooked) {
                              handleBooking(slot);
                            }
                          }}
                          disabled={!canBook || (isBooked && !isUserSlot)}
                          variant={isUserSlot ? "default" : "outline"}
                          className={`h-20 ${isUserSlot ? 'bg-green-500 hover:bg-green-600' : ''} ${isPast ? 'opacity-50' : ''}`}
                        >
                          {slot}
                          <br />
                          {isPast ? "Past" : isUserSlot ? "Your Booking" : (isBooked ? "Unavailable" : "Available")}
                        </Button>
                      </AlertDialogTrigger>
                      {isUserSlot && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your booking for {slot} on {formatDate(selectedDate)}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={cancelBooking}>Yes, Cancel Booking</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
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
