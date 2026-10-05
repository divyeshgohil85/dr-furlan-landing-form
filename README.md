# Dr. Rammo Appointment Form

A TypeScript-based appointment booking form built with React, Formik, and Tailwind CSS. This is a conversion of the original JavaScript form to TypeScript with proper type definitions and improved type safety.

## Features

- **TypeScript**: Fully typed with comprehensive type definitions
- **Form Validation**: Using Formik and Yup for robust form validation
- **Calendar Integration**: React-datepicker with custom styling
- **Phone Input**: International phone number support
- **Responsive Design**: Mobile-friendly responsive layout
- **Real-time Availability**: Dynamic slot availability checking
- **Error Handling**: Comprehensive error handling and user feedback

## Tech Stack

- **React 19**: Modern React with hooks
- **TypeScript**: Full type safety
- **Formik**: Form state management
- **Yup**: Schema validation
- **Tailwind CSS**: Utility-first styling
- **React-datepicker**: Date picker component
- **React-phone-number-input**: Phone number input
- **Moment.js**: Date/time manipulation
- **React-toastify**: Notification system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual API keys and configuration values in the `.env` file.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# GHL API Configuration
VITE_GHL_API_KEY=your_ghl_api_key_here
VITE_GHL_LOCATION_ID=your_location_id_here
VITE_GHL_CALENDAR_ID=your_calendar_id_here

# Provider Specific Configuration
VITE_KEVIN_GHL_CALENDAR_ID=kevin_calendar_id_here
VITE_BECKY_GHL_CALENDAR_ID=becky_calendar_id_here
VITE_KEVIN_GHL_USER_ID=kevin_user_id_here
VITE_BECKY_GHL_USER_ID=becky_user_id_here

# Meeting Location IDs
VITE_MEETING_LOCATION_ID_FLORENCE=florence_location_id_here
VITE_MEETING_LOCATION_ID_MURRELLS_INLET=murrells_inlet_location_id_here
VITE_MEETING_LOCATION_ID_NORTH_MYRLE_BEACH=north_myrtle_beach_location_id_here

# Pipeline Configuration
VITE_GHL_PIPELINE_ID=your_pipeline_id_here
VITE_GHL_PIPELINE_SCHEDULE_STAGE_ID=your_schedule_stage_id_here

# Server Configuration
VITE_SERVER_URL=your_server_url_here
VITE_GHL_USER_ID=your_user_id_here
```

## Project Structure

```
dr-rammo/
src/
  components/
    - AppointmentFormV2.tsx    # Main form component
    - AppointmentFormV2.css   # Form styles
    - ErrorText.tsx           # Error text component
  types/
    - index.ts                # TypeScript type definitions
  utils/
    - bookingApi.ts           # Booking API functions
    - constants.ts            # Application constants
    - ghlApi.ts              # GHL API functions
  - App.tsx                  # Main app component
  - main.tsx                # Application entry point
  - index.css               # Global styles
```

## Key Features

### Form Fields
- Patient Type selection
- Personal Information (Name, Email, Phone, Date of Birth)
- Appointment Details (Type of Visit, Location, Provider)
- Date & Time selection with availability checking
- Optional notes and referral information

### Validation
- Required field validation
- Email format validation
- Phone number validation
- Date of birth validation (not in future)
- Custom validation rules for each field

### Calendar Integration
- Custom styled calendar component
- Available date highlighting
- Time slot selection with morning/afternoon grouping
- Real-time availability checking

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## TypeScript Conversion

This project has been converted from JavaScript to TypeScript with:

- Complete type definitions for all components and utilities
- Proper typing for API responses and form data
- Type-safe event handlers and callbacks
- Enhanced developer experience with IntelliSense
- Reduced runtime errors through type checking

## API Integration

The form integrates with:
- GHL (Go High Level) API for contact management
- Booking API for appointment scheduling
- Calendar API for availability checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Rapid Weight Loss Centers appointment system.
