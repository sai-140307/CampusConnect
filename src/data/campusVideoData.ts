export interface VideoScene {
  id: string;
  chapterTitle: string;
  chapterBadge: string;
  location: string;
  room: string;
  duration: number; // in seconds
  imageUrl: string;
  fallbackImageUrl: string;
  videoClipUrl?: string;
  heading: string;
  subtitle: string;
  narration: string;
  highlights: string[];
  stats: {
    label: string;
    value: string;
  }[];
  perkAlert?: string;
}

export const CAMPUS_TOUR_SCENES: VideoScene[] = [
  {
    id: 'quad-library',
    chapterTitle: 'Smart Campus Quad & Central Library',
    chapterBadge: 'Architecture & Study Pods',
    location: 'Central Campus Quadrangle',
    room: 'Technology Tower Atrium',
    duration: 12,
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400&auto=format&fit=crop&q=85',
    videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    heading: 'World-Class Academic Infrastructure',
    subtitle: 'Over 300,000 sq ft of multi-tier collaborative learning space with gigabit Wi-Fi and solar-powered pods.',
    narration: 'Welcome to the Central Academic Quad. Here at VIT, smart classrooms connect seamlessly with high-speed digital research terminals and 24/7 quiet study hubs.',
    highlights: [
      'Solar-powered outdoor laptop benches',
      'High-speed Wi-Fi 6 coverage campus-wide',
      'Automated book return and quiet study lounges'
    ],
    stats: [
      { label: 'Study Desks', value: '2,400+' },
      { label: 'Wi-Fi Speed', value: '1 Gbps' },
      { label: 'Open Hours', value: '24/7 Pods' }
    ],
    perkAlert: 'Free coffee stations on 2nd floor library'
  },
  {
    id: 'makerspace-robotics',
    chapterTitle: 'Innovation Makerspace & AI Guilds',
    chapterBadge: 'Hardware & Code Labs',
    location: 'Silver Jubilee Tower',
    room: 'Level 4 Robotic Lab',
    duration: 14,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&auto=format&fit=crop&q=85',
    videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    heading: 'Hands-On Robotics & Deep Tech Research',
    subtitle: 'State-of-the-art CNC routers, 3D printing clusters, and GPU server rigs for student research teams.',
    narration: 'The Innovation Makerspace is where student ideas turn into functional hardware prototypes and production code. Supported by faculty mentors and top tech sponsors.',
    highlights: [
      '30+ High-precision 3D printers and laser cutters',
      'Dedicated NVIDIA RTX GPU workstations for AI models',
      'Electronic soldering stations & oscilloscope benches'
    ],
    stats: [
      { label: 'Active Teams', value: '45+ Labs' },
      { label: 'Patents Filed', value: '120+' },
      { label: 'Hardware Grants', value: '$250k+' }
    ],
    perkAlert: '3D printing filament sponsored by engineering dean'
  },
  {
    id: 'supercomputing-ai-datacenter',
    chapterTitle: 'Supercomputing & AI Cloud Data Center',
    chapterBadge: 'High-Performance Computing',
    location: 'Anna Auditorium Complex',
    room: 'Tier-3 HPC Server Core',
    duration: 12,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1400&auto=format&fit=crop&q=85',
    videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    heading: 'Petascale AI Research & Cloud Infrastructure',
    subtitle: 'Empowering students to train deep neural networks, run quantum chemistry simulations, and manage big data pipelines.',
    narration: 'Step inside the Tier-3 Supercomputing facility. Providing high-throughput clusters for autonomous robotics, genomic mapping, and student AI ventures.',
    highlights: [
      'Over 500 TFLOPS student-accessible compute cluster',
      'Direct low-latency 10 Gbps inter-server optical fiber',
      'Automated batch job scheduler for computer science thesis work'
    ],
    stats: [
      { label: 'Compute Power', value: '500+ TFLOPS' },
      { label: 'Storage Array', value: '2.5 Petabytes' },
      { label: 'Network SLA', value: '99.99%' }
    ],
    perkAlert: 'Free GPU credits granted to hackathon finalists'
  },
  {
    id: 'formula-racing-ev-workshop',
    chapterTitle: 'Formula Student & EV Racing Garage',
    chapterBadge: 'Automotive & Motorsports',
    location: 'Automotive Research Center',
    room: 'Dyno Testing & Chassis Bay',
    duration: 13,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1400&auto=format&fit=crop&q=85',
    videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    heading: 'Championship Formula Electric Prototyping',
    subtitle: 'Student engineers design, weld, simulate, and race open-wheel electric racecars in international competitions.',
    narration: 'The Motorsports bay is the high-octane home of our Formula Student EV racing team. From carbon-fiber aerodynamics to regenerative braking algorithms.',
    highlights: [
      'Custom carbon fiber autoclave and suspension jigs',
      'Regenerative battery pack testing station',
      'Chassis dynamometer with real-time CAN bus telemetry'
    ],
    stats: [
      { label: '0-100 km/h', value: '2.8 Secs' },
      { label: 'Global Podiums', value: '14 Trophies' },
      { label: 'Team Members', value: '65 Engineers' }
    ],
    perkAlert: 'Track day test drives for top mechanical engineering clubs'
  },
  {
    id: 'hackathon-auditorium',
    chapterTitle: 'Hackathons & Grand Amphitheater',
    chapterBadge: 'Student Life & Competitions',
    location: 'Dr. M.G.R. Auditorium',
    room: 'Main Arena Stage',
    duration: 15,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&auto=format&fit=crop&q=85',
    videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    heading: 'Vibrant Campus Culture & Overnight Hackathons',
    subtitle: 'From annual tech summits like Gravitas to 36-hour hackathons with participants worldwide.',
    narration: 'Experience the electric energy of VIT hackathons. Thousands of developers, designers, and innovators unite to build game-changing products.',
    highlights: [
      '3,500-seat acoustic amphitheater with 4K LED backdrops',
      'Dedicated 36-hour hackathon rest zones and meal buffets',
      'On-stage venture demo days and recruiting mixers'
    ],
    stats: [
      { label: 'Annual Hackers', value: '8,000+' },
      { label: 'Prize Pool', value: '$50,000' },
      { label: 'Industry Judges', value: '60+ Tech VPs' }
    ],
    perkAlert: 'Midnight Pizza drops & Red Bull energy stations'
  },
  {
    id: 'biotech-nanotech-cleanroom',
    chapterTitle: 'Biomedical & Nanotech Cleanroom',
    chapterBadge: 'Bioscience & Genetics',
    location: 'Hexagon Science Tower',
    room: 'Level 2 Bio-Imaging Lab',
    duration: 12,
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1400&auto=format&fit=crop&q=85',
    heading: 'Translational Bio-Engineering & Discovery',
    subtitle: 'Equipped with fluorescence microscopy, gene editing synthesizers, and cell-culture incubators.',
    narration: 'At the Biomedical research laboratories, students and faculty pioneer medical implants, biosensors, and sustainable bioinformatics algorithms.',
    highlights: [
      'Class 10,000 dust-free laminar cleanroom chambers',
      'Laser confocal microscope with 3D cellular tomography',
      'Automated PCR gene amplifiers & cryopreservation units'
    ],
    stats: [
      { label: 'Published Papers', value: '340+' },
      { label: 'Research Grants', value: '$1.2M+' },
      { label: 'Lab ISO Standard', value: 'ISO 9001' }
    ],
    perkAlert: 'Interdisciplinary bio-hackathon held every autumn'
  },
  {
    id: 'media-podcast-esports',
    chapterTitle: 'Digital Media Studio & Podcast Arena',
    chapterBadge: 'Broadcasting & Creative Arts',
    location: 'Student Activity Center',
    room: 'Studio A & Stream Deck',
    duration: 11,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&auto=format&fit=crop&q=85',
    heading: 'Student Broadcasting, Esports & Creative Guilds',
    subtitle: 'Fully acoustic sound-dampened podcasting suites, multi-camera 4K switcher desks, and esports arena.',
    narration: 'From student talk shows and tech podcasts to live esports tournament commentary, this studio fuels campus creators with professional studio gear.',
    highlights: [
      'Broadcast-grade Shure microphones & Rodecaster Pro boards',
      'Blackmagic 4K studio cameras with live chroma-key backdrops',
      'Ultra-low-latency esports casting and tournament booth'
    ],
    stats: [
      { label: 'Live Broadcasts', value: '150+ / Yr' },
      { label: 'Podcast Listeners', value: '45,000+' },
      { label: 'Esports Roster', value: '8 Teams' }
    ],
    perkAlert: 'Free studio recording time bookable via CampusConnect'
  },
  {
    id: 'student-union-dining',
    chapterTitle: 'Student Union Plaza & Dining Hub',
    chapterBadge: 'Catering & Social Hub',
    location: 'Gazebo Plaza & Food Street',
    room: 'Central Court',
    duration: 12,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&auto=format&fit=crop&q=85',
    heading: 'Culinary Delights & Community Lounges',
    subtitle: 'Multi-cuisine food courts, artisanal cafes, and vibrant outdoor lawns for after-class team syncs.',
    narration: 'Take a break at the Gazebo Food Street. Whether grabbing quick samosas, fresh espresso, or artisan boba, campus dining is a student favorite.',
    highlights: [
      'Over 20+ specialized dining kiosks and international food chains',
      'Outdoor shaded pergolas with charging ports',
      'Night-canteen services open until 1:00 AM'
    ],
    stats: [
      { label: 'Dining Kiosks', value: '24+' },
      { label: 'Meal Options', value: '100% Halal/Veg' },
      { label: 'Catering Drops', value: '15+ Weekly' }
    ],
    perkAlert: 'Free event catering tracked automatically on CampusConnect'
  },
  {
    id: 'cultural-amphitheatre',
    chapterTitle: 'Riviera Cultural Pavilion & Open Theatre',
    chapterBadge: 'Music, Drama & Festivals',
    location: 'Outdoor Lake Amphitheatre',
    room: 'Grand Open Stage',
    duration: 13,
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1400&auto=format&fit=crop&q=85',
    heading: 'International Cultural Fests & Musical Performances',
    subtitle: 'The iconic open-air amphitheatre hosting Riviera, battle of the bands, classical Indian dance, and theatrical plays.',
    narration: 'Under the night sky, thousands of students gather for music concerts, celebrity performances, and club cultural showcases at the open theatre.',
    highlights: [
      '5,000+ Audience capacity amphitheatre facing the lake',
      'Custom acoustic line-array speakers and intelligent spotlights',
      'Year-round cultural festivals and dramatic arts showcases'
    ],
    stats: [
      { label: 'Fest Attendees', value: '40,000+' },
      { label: 'Cultural Clubs', value: '28 Guilds' },
      { label: 'International Acts', value: '15+ / Yr' }
    ],
    perkAlert: 'VIP club seating for active student volunteers'
  },
  {
    id: 'sports-outdoor-walkways',
    chapterTitle: 'Athletics, Green Lawns & Walkways',
    chapterBadge: 'Wellness & Athletics',
    location: 'Outdoor Sports Complex',
    room: 'Olympic Running Track & Courts',
    duration: 12,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&auto=format&fit=crop&q=85',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1400&auto=format&fit=crop&q=85',
    heading: 'Holistic Wellness & Athletic Grounds',
    subtitle: 'Olympic-grade swimming facilities, synthetic tennis courts, floodlit basketball arenas, and lush green walkways.',
    narration: 'Balance high-intensity coding with world-class athletics. From intramural leagues to sunset strolls along the palm walkways, campus life is vibrant.',
    highlights: [
      'Floodlit synthetic football and cricket grounds',
      'Indoor badminton courts and cardio fitness gym',
      'Eco-friendly tree-lined pedestrian walking boulevards'
    ],
    stats: [
      { label: 'Acreage', value: '372 Acres' },
      { label: 'Sports Clubs', value: '18 Guilds' },
      { label: 'Campus Trees', value: '15,000+' }
    ],
    perkAlert: 'Free locker and gym access for enrolled students'
  }
];
