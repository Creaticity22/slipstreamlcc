export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearnArticle {
  id: string;
  title: string;
  emoji: string;
  color: string;
  time: string;
  intro: string;
  sections: { heading: string; body: string }[];
  takeaway: string;
  quiz: QuizQuestion[];
}

export const learnArticles: LearnArticle[] = [
  {
    id: "timetables",
    title: "Reading timetables like a pro",
    emoji: "📋",
    color: "bg-slipstream-teal/15",
    time: "2 min",
    intro:
      "Timetables look intimidating, but once you crack the pattern they take seconds to read. Here's the cheat sheet.",
    sections: [
      {
        heading: "Columns are journeys, rows are stops",
        body: "Each vertical column is one bus or train doing a full trip. Read top to bottom to see what time it reaches each stop along the way.",
      },
      {
        heading: "Find your stop, then scan across",
        body: "Locate your stop on the left, then move right until you see a time that suits you. That's your departure. The time at your destination row is your arrival.",
      },
      {
        heading: "Watch the small print",
        body: "Look for letters like 'S' (school days only), 'NS' (not Saturdays) or 'H' (holidays). The key is usually at the bottom — a 30-second check saves a wasted trip.",
      },
    ],
    takeaway:
      "Columns = trips, rows = stops, footnotes = exceptions. That's 90% of timetable reading.",
    quiz: [
      {
        question: "What does a column in a timetable represent?",
        options: ["A single stop", "One full bus or train trip", "A day of the week", "A fare zone"],
        correctIndex: 1,
        explanation: "Each column is one vehicle's journey from start to end.",
      },
      {
        question: "You see 'NS' next to a time. What should you check?",
        options: [
          "It's the next stop",
          "It's a non-stop service",
          "It doesn't run on Saturdays",
          "It needs a special ticket",
        ],
        correctIndex: 2,
        explanation: "'NS' commonly means 'Not Saturdays'. Always check the footnote key.",
      },
    ],
  },
  {
    id: "railcard",
    title: "How to save with a 16-25 Railcard",
    emoji: "💳",
    color: "bg-slipstream-purple/15",
    time: "3 min",
    intro:
      "If you're 16-25 (or a mature student), this little card can knock 1/3 off most rail fares in Britain. Here's how to make it pay for itself fast.",
    sections: [
      {
        heading: "What you get",
        body: "1/3 off most Standard and First Class fares across Britain. It costs around £30 a year (or £70 for three years) and pays for itself in just a few trips.",
      },
      {
        heading: "When it works best",
        body: "Off-peak journeys give the biggest savings. Before 10am on weekdays there's a minimum fare rule, so plan longer trips for after the morning rush.",
      },
      {
        heading: "Stack with advance tickets",
        body: "Buy advance tickets days ahead AND apply your Railcard for compounded savings. Add it to your phone wallet so you can show it instantly when asked.",
      },
    ],
    takeaway:
      "Off-peak + advance + Railcard = the cheapest way to travel by train in your twenties.",
    quiz: [
      {
        question: "How much do you typically save with a 16-25 Railcard?",
        options: ["10% off", "1/3 off", "Half price", "Free travel"],
        correctIndex: 1,
        explanation: "It's a 1/3 discount on most Standard and First Class fares.",
      },
      {
        question: "When does the morning minimum-fare rule apply?",
        options: ["All day weekends", "Before 10am on weekdays", "After 6pm", "Bank holidays only"],
        correctIndex: 1,
        explanation: "There's a minimum fare on weekday journeys started before 10am.",
      },
    ],
  },
  {
    id: "interchange",
    title: "Your first bus interchange",
    emoji: "🚌",
    color: "bg-slipstream-coral/15",
    time: "2 min",
    intro:
      "Interchanges (big bus stations with lots of stands) can feel chaotic on day one. A two-minute plan makes it easy.",
    sections: [
      {
        heading: "Find your stand, not just your bus",
        body: "Buses leave from lettered stands (A, B, C…). Check the departure board for your route number — it'll show the stand letter and time. Head straight there.",
      },
      {
        heading: "Give yourself a buffer",
        body: "Aim to be at your stand 3-5 minutes early. Stands can change last minute, and you don't want to sprint across the concourse with a heavy bag.",
      },
      {
        heading: "Double-check the destination",
        body: "Two buses with the same number can go opposite directions. Look at the destination on the front of the bus before you board — if in doubt, ask the driver.",
      },
    ],
    takeaway: "Stand letter, 5-min buffer, check the destination. You're sorted.",
    quiz: [
      {
        question: "What's the first thing to find on the departure board?",
        options: ["The driver's name", "Your stand letter", "The fare", "The weather"],
        correctIndex: 1,
        explanation: "Your stand letter tells you exactly where to wait.",
      },
      {
        question: "Why check the destination on the front of the bus?",
        options: [
          "To take a photo",
          "Same route number can run both directions",
          "It shows the WiFi password",
          "It's the law",
        ],
        correctIndex: 1,
        explanation: "Two buses with the same number often run opposite directions.",
      },
    ],
  },
  {
    id: "evening-safety",
    title: "Staying safe on evening journeys",
    emoji: "🔦",
    color: "bg-slipstream-gold/15",
    time: "3 min",
    intro:
      "Most evening trips are completely uneventful. A few small habits make them feel safer and easier.",
    sections: [
      {
        heading: "Sit smart on the bus",
        body: "Downstairs, near the driver, is the calmest spot after dark. You've got a clear exit and a member of staff close by. Keep your bag on your lap, not the floor.",
      },
      {
        heading: "Plan the walk home",
        body: "Pick well-lit, busy streets even if they're slightly longer. Share your live location with a friend or family member — Slipstream's trip share link does this in one tap.",
      },
      {
        heading: "Trust your gut",
        body: "If something feels off, get off at the next stop with people around — a shop, a station, a café. Better an extra five minutes than a sketchy ten.",
      },
    ],
    takeaway:
      "Sit near the driver, walk lit routes, share your location, trust your instincts.",
    quiz: [
      {
        question: "Where's the safest spot to sit on a bus at night?",
        options: ["Top deck back row", "Downstairs near the driver", "By the back door", "Anywhere upstairs"],
        correctIndex: 1,
        explanation: "Near the driver = clear exit and a staff member close by.",
      },
      {
        question: "What should you do if something feels off?",
        options: [
          "Stay put and hope it passes",
          "Get off at the next busy, well-lit stop",
          "Confront the person",
          "Put headphones on",
        ],
        correctIndex: 1,
        explanation: "Move to a safer spot with people around. Trust your gut.",
      },
    ],
  },
  {
    id: "planet",
    title: "Why public transport helps the planet",
    emoji: "🌍",
    color: "bg-slipstream-lime/15",
    time: "2 min",
    intro:
      "Choosing the bus or train over a car isn't just cheaper — it's one of the highest-impact climate choices you can make day to day.",
    sections: [
      {
        heading: "Shared rides, shared emissions",
        body: "A full bus takes around 40 cars off the road. Per passenger, that's roughly half the CO₂ of driving solo, and a fraction of the parking and tyre pollution.",
      },
      {
        heading: "Cleaner cities, healthier you",
        body: "Less traffic means cleaner air, quieter streets and a built-in walk to the stop. That extra movement adds up — most regular transit users hit their daily steps without thinking.",
      },
      {
        heading: "Small switch, big total",
        body: "Swapping just two car trips a week for the bus can save around 500kg of CO₂ a year. Multiply that by a city full of people and the impact is huge.",
      },
    ],
    takeaway:
      "Bus = ~half the CO₂, cleaner air, free steps. One of the easiest climate wins going.",
    quiz: [
      {
        question: "Roughly how many cars does one full bus replace?",
        options: ["5", "15", "40", "100"],
        correctIndex: 2,
        explanation: "A full bus takes around 40 cars off the road.",
      },
      {
        question: "Swapping two car trips a week for the bus can save about…",
        options: ["50kg CO₂ a year", "500kg CO₂ a year", "5 tonnes CO₂ a year", "Nothing measurable"],
        correctIndex: 1,
        explanation: "Around 500kg CO₂ a year — small habit, big total.",
      },
    ],
  },
  {
    id: "etiquette",
    title: "Bus etiquette: the unwritten rules",
    emoji: "🤝",
    color: "bg-slipstream-sky/15",
    time: "2 min",
    intro:
      "Nobody hands you a rulebook, but a few small habits make every journey smoother for everyone (including you).",
    sections: [
      {
        heading: "Let people off first",
        body: "Stand to the side of the doors and wait. Trying to board while others get off creates a bottleneck and slows the whole bus down.",
      },
      {
        heading: "Move down the aisle",
        body: "If it's busy, shuffle towards the back so others can board. Bag on your lap, not the seat next to you. Priority seats are for those who need them.",
      },
      {
        heading: "Volume check",
        body: "Headphones in, speakerphone off, music low enough that the person next to you can't hear it. A quick 'thanks driver!' on the way off costs nothing and makes someone's day.",
      },
    ],
    takeaway: "Off first, move down, headphones in, thank the driver. Easy wins.",
    quiz: [
      {
        question: "What should you do at the doors when the bus arrives?",
        options: [
          "Push on quickly",
          "Stand aside and let people off first",
          "Wait by the back door",
          "Knock on the window",
        ],
        correctIndex: 1,
        explanation: "Letting people off first keeps everything moving.",
      },
      {
        question: "Best practice for music on the bus?",
        options: ["Speakerphone on low", "No music at all", "Headphones, low enough nobody else hears", "Sing along quietly"],
        correctIndex: 2,
        explanation: "Headphones, low volume — your soundtrack, not theirs.",
      },
    ],
  },
];
