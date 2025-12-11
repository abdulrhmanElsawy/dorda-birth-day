import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Keyboard, Mousewheel } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/effect-fade';
import './css/styles.css';
import countdownSound from './soundeffects/countdown.mp3';
import imagesMovingSound from './soundeffects/imagesmoving.mp3';
import galleryMusic from './music/amrdiap.mp3';
import galleryMusic2 from './music/amrdiap2.mp3';
import galleryMusic3 from './music/amrdiap3.mp3';

// Load all images from DORDA folder dynamically
const importAllImages = (r) => {
  return r.keys().map(r);
};

// Get all images from the DORDA folder (excluding HEIC files)
const imageContext = require.context('./images/DORDA', false, /\.(jpg|jpeg|png|webp)$/i);
const allImages = importAllImages(imageContext);

// Sort images by filename to maintain order
const MONTAGE_IMAGES = allImages.sort((a, b) => {
  const aName = a.split('/').pop();
  const bName = b.split('/').pop();
  return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
});

const QUESTIONS = [
  'فاكرة أول يوم إتقلنا فيه ؟ ',
  ' طب فاكرة لما وقعتي في حبي من اول نظرة ؟',
  '  عشان انا وسيم وكده  ',
  ' كل سنة وانت طيبة يا حبيبي وعقبال مليون سنة يارب',
  ' بحبك  ',
];

const STORY_SLIDES = [
  {
    text: 'منذ اللحظة الأولى التي رأيتك فيها، عرفت أن حياتي ستتغير للأبد',
    image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=1920'
  },
  {
    text: 'كل يوم معك هو مغامرة جديدة مليئة بالحب والضحك',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1920'
  },
  {
    text: 'أنتِ النور الذي يضيء طريقي في أحلك الأوقات',
    image: 'https://images.unsplash.com/photo-1522673607291-d2f8d6f4be48?w=1920'
  },
  {
    text: 'عيد ميلاد سعيد يا حب حياتي، يا دوردا 💛',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1920'
  },
];

const STAGES = {
  INTRO: 'intro',
  DARKEN: 'darken',
  COUNTDOWN: 'countdown',
  MONTAGE: 'montage',
  QUESTIONS: 'questions',
  SCROLL_GALLERY: 'scroll_gallery',
};

const RELEASE_DATE = new Date('2025-12-12T00:00:00');
const PASSWORD = '1212';
const COUNTDOWN_PASSWORD = '26573912';

const Website = () => {
  const [stage, setStage] = useState(STAGES.INTRO);
  const [countdown, setCountdown] = useState(5);
  const [montageIndex, setMontageIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [backgroundKey, setBackgroundKey] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleImages, setVisibleImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [questionStep, setQuestionStep] = useState(1); // 1 = both "ايوة", 2 = "ايوة" and "لا"
  const [noButtonVisible, setNoButtonVisible] = useState(true);
  const [currentMusicTrack, setCurrentMusicTrack] = useState(1); // 1, 2, or 3
  const [imageDirection, setImageDirection] = useState('bottom');
  const [questionBackgrounds, setQuestionBackgrounds] = useState({ step1: null, step2: null });
  const [buttonClickCount, setButtonClickCount] = useState(0);
  const [isDatePassed, setIsDatePassed] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [countdownPasswordInput, setCountdownPasswordInput] = useState('');
  const [countdownPasswordError, setCountdownPasswordError] = useState(false);
  const swiperRef = useRef(null);
  const galleryContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const imageTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const musicChangeTimerRef = useRef(null);

  const countdownIntervalRef = useRef(null);
  const montageIntervalRef = useRef(null);
  const countdownAudioRef = useRef(null);
  const imagesMovingAudioRef = useRef(null);
  const galleryMusicRef = useRef(null);
  const galleryMusic2Ref = useRef(null);
  const galleryMusic3Ref = useRef(null);

  // Check if release date has passed
  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
      setIsDatePassed(now >= RELEASE_DATE);
    };
    
    checkDate();
    // Check every minute in case date changes
    const interval = setInterval(checkDate, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if password is stored in localStorage (so user doesn't have to re-enter)
  useEffect(() => {
    if (isDatePassed) {
      const savedPassword = localStorage.getItem('website_password_verified');
      if (savedPassword === 'true') {
        setIsPasswordCorrect(true);
      }
    }
  }, [isDatePassed]);

  // Handle password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsPasswordCorrect(true);
      setPasswordError(false);
      localStorage.setItem('website_password_verified', 'true');
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  // Handle countdown password submission
  const handleCountdownPasswordSubmit = (e) => {
    e.preventDefault();
    if (countdownPasswordInput === COUNTDOWN_PASSWORD) {
      // Skip countdown and go directly to montage
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current.currentTime = 0;
      }
      setStage(STAGES.MONTAGE);
      setMontageIndex(0);
      setCountdownPasswordError(false);
      setCountdownPasswordInput('');
    } else {
      setCountdownPasswordError(true);
      setCountdownPasswordInput('');
    }
  };

  // Assign random images to each question (persist across renders)
  const questionsWithImages = useMemo(() => {
    return QUESTIONS.map((question) => {
      const randomImage = MONTAGE_IMAGES[Math.floor(Math.random() * MONTAGE_IMAGES.length)];
      return {
        text: question,
        image: randomImage
      };
    });
  }, []); // Empty dependency array so it only runs once

  // Button texts based on click count
  const getButtonText = () => {
    switch (buttonClickCount) {
      case 0:
        return 'دوسي هنا';
      case 1:
        return 'دوسي براحة';
      case 2:
        return 'بهزر معاكي دوسي تاني';
      case 3:
        return 'اخر مرة خلاص . بحبك';
      default:
        return 'دوسي هنا';
    }
  };

  // Handle start button click
  const handleStart = useCallback(() => {
    if (buttonClickCount < 3) {
      // Increment click count and update text
      setButtonClickCount(prev => prev + 1);
    } else {
      // After 4 clicks, actually start
      setStage(STAGES.DARKEN);
      setTimeout(() => {
        setStage(STAGES.COUNTDOWN);
        setCountdown(5);
      }, 2000);
    }
  }, [buttonClickCount]);

  // Countdown effect
  useEffect(() => {
    if (stage === STAGES.COUNTDOWN) {
      // Play countdown sound (skip first 2 seconds)
      if (countdownAudioRef.current) {
        countdownAudioRef.current.currentTime = 4;
        countdownAudioRef.current.play().catch((error) => {
          console.log('Error playing countdown sound:', error);
        });
      }

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            // Stop countdown sound when countdown ends
            if (countdownAudioRef.current) {
              countdownAudioRef.current.pause();
              countdownAudioRef.current.currentTime = 0;
            }
            setTimeout(() => {
              setStage(STAGES.MONTAGE);
              setMontageIndex(0);
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Stop countdown sound if we leave the countdown stage
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stage]);

  // Montage effect
  useEffect(() => {
    if (stage === STAGES.MONTAGE) {
      // Play images moving sound with loop
      if (imagesMovingAudioRef.current) {
        imagesMovingAudioRef.current.currentTime = 0;
        imagesMovingAudioRef.current.loop = true;
        imagesMovingAudioRef.current.play().catch((error) => {
          console.log('Error playing images moving sound:', error);
        });
      }

      montageIntervalRef.current = setInterval(() => {
        setMontageIndex((prev) => {
          if (prev >= MONTAGE_IMAGES.length - 1) {
            clearInterval(montageIntervalRef.current);
            // Stop images moving sound when montage ends
            if (imagesMovingAudioRef.current) {
              imagesMovingAudioRef.current.loop = false;
              imagesMovingAudioRef.current.pause();
              imagesMovingAudioRef.current.currentTime = 0;
            }
            setTimeout(() => {
              setStage(STAGES.QUESTIONS);
              setActiveQuestionIndex(0);
            }, 500);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      // Stop images moving sound if we leave the montage stage
      if (imagesMovingAudioRef.current) {
        imagesMovingAudioRef.current.loop = false;
        imagesMovingAudioRef.current.pause();
        imagesMovingAudioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (montageIntervalRef.current) {
        clearInterval(montageIntervalRef.current);
      }
    };
  }, [stage]);

  // Handle Swiper slide change
  const handleSlideChange = useCallback((swiper) => {
    setActiveQuestionIndex(swiper.activeIndex);
    setBackgroundKey(swiper.activeIndex); // Trigger background animation
    
    // If we reach the last slide, transition to scroll gallery
    if (swiper.activeIndex === QUESTIONS.length - 1 && swiper.isEnd) {
      setTimeout(() => {
        setStage(STAGES.SCROLL_GALLERY);
        setScrollPosition(0);
        setVisibleImages([]);
      }, 1000);
    }
  }, []);

  // Prevent downward scrolling - only allow upward
  const handleTouchMove = useCallback((swiper, event) => {
    if (swiper.touch && swiper.touch.currentY !== undefined && swiper.touch.startY !== undefined) {
      const deltaY = swiper.touch.startY - swiper.touch.currentY;
      // Only allow upward swipes (positive deltaY means moving up)
      if (deltaY < 0) {
        event.preventDefault();
        return false;
      }
    }
  }, []);

  // Function to get random direction for image entrance
  const getRandomDirection = () => {
    const directions = ['bottom', 'top', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  };

  // Function to play music track
  const playMusicTrack = (trackNumber) => {
    // Stop all music first
    if (galleryMusicRef.current) galleryMusicRef.current.pause();
    if (galleryMusic2Ref.current) galleryMusic2Ref.current.pause();
    if (galleryMusic3Ref.current) galleryMusic3Ref.current.pause();

    const musicRef = trackNumber === 1 ? galleryMusicRef : 
                     trackNumber === 2 ? galleryMusic2Ref : 
                     galleryMusic3Ref;

    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.loop = true;
      musicRef.current.volume = 0.7;
      musicRef.current.play().catch((error) => {
        console.log('Error playing gallery music:', error);
      });
    }
    setCurrentMusicTrack(trackNumber);
  };

  // Sequential image gallery effect
  useEffect(() => {
    if (stage === STAGES.SCROLL_GALLERY) {
      // Play initial gallery music
      playMusicTrack(1);

      // Reset state
      setCurrentImageIndex(-1);
      setIsImageVisible(false);
      setVisibleImages([]);
      setShowQuestion(false);
      setQuestionStep(1);
      setNoButtonVisible(true);
      setCurrentMusicTrack(1);

      // Assign random background images for each question
      const randomImage1 = MONTAGE_IMAGES[Math.floor(Math.random() * MONTAGE_IMAGES.length)];
      const randomImage2 = MONTAGE_IMAGES[Math.floor(Math.random() * MONTAGE_IMAGES.length)];
      setQuestionBackgrounds({
        step1: randomImage1,
        step2: randomImage2
      });

      // Show first question after 90 seconds
      questionTimerRef.current = setTimeout(() => {
        setShowQuestion(true);
        setQuestionStep(1);
      }, 90000);

      // Start showing images sequentially after a short delay
      const startImageSequence = () => {
        // Function to show next image
        const showNextImage = (index) => {
          if (index >= MONTAGE_IMAGES.length) {
            // All images shown, show final message
            return;
          }

          // Set random direction for this image
          setImageDirection(getRandomDirection());

          // Show current image
          setCurrentImageIndex(index);
          setIsImageVisible(true);

          // After image appears, dances, and fades out, show next one
          // Timing: 0.8s appear + 2s dance + 0.5s fade = 3.3s total per image
          imageTimerRef.current = setTimeout(() => {
            setIsImageVisible(false);
            // Wait for fade out, then show next image
            setTimeout(() => {
              showNextImage(index + 1);
            }, 500);
          }, 3300);
        };

        // Start the sequence
        setTimeout(() => {
          showNextImage(0);
        }, 500);
      };

      startImageSequence();

      return () => {
        if (imageTimerRef.current) {
          clearTimeout(imageTimerRef.current);
        }
        if (questionTimerRef.current) {
          clearTimeout(questionTimerRef.current);
        }
        if (musicChangeTimerRef.current) {
          clearTimeout(musicChangeTimerRef.current);
        }
        if (galleryMusicRef.current) {
          galleryMusicRef.current.pause();
          galleryMusicRef.current.currentTime = 0;
        }
        if (galleryMusic2Ref.current) {
          galleryMusic2Ref.current.pause();
          galleryMusic2Ref.current.currentTime = 0;
        }
        if (galleryMusic3Ref.current) {
          galleryMusic3Ref.current.pause();
          galleryMusic3Ref.current.currentTime = 0;
        }
      };
    } else {
      // Stop music when leaving gallery stage
      if (galleryMusicRef.current) {
        galleryMusicRef.current.pause();
        galleryMusicRef.current.currentTime = 0;
      }
      if (galleryMusic2Ref.current) {
        galleryMusic2Ref.current.pause();
        galleryMusic2Ref.current.currentTime = 0;
      }
      if (galleryMusic3Ref.current) {
        galleryMusic3Ref.current.pause();
        galleryMusic3Ref.current.currentTime = 0;
      }
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current);
      }
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
      if (musicChangeTimerRef.current) {
        clearTimeout(musicChangeTimerRef.current);
      }
    }
  }, [stage]);

  // Handle question button clicks
  const handleQuestionAnswer = (answer) => {
    if (questionStep === 1) {
      // First question - both buttons are "ايوة"
      if (answer === 'yes') {
        setShowQuestion(false);
        playMusicTrack(2);
        
        // Show second question after 90 seconds
        musicChangeTimerRef.current = setTimeout(() => {
          setShowQuestion(true);
          setQuestionStep(2);
          setNoButtonVisible(true);
        }, 90000);
      }
    } else if (questionStep === 2) {
      // Second question - "ايوة" and "لا"
      if (answer === 'yes') {
        setShowQuestion(false);
        playMusicTrack(3);
      } else if (answer === 'no') {
        // Hide "لا" button and show only "ايوة"
        setNoButtonVisible(false);
        // After a moment, switch to music 3
        setTimeout(() => {
          playMusicTrack(3);
          setShowQuestion(false);
        }, 500);
      }
    }
  };

  // Render functions
  const renderIntro = () => (
    <motion.div 
      className="stage intro-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="intro-content">
        <motion.div 
          className="title-container"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            className="sparkle sparkle-1"
            animate={{ 
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            ✨
          </motion.div>
          <motion.h1 
            className="main-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Happy Birthday
          </motion.h1>
          <motion.h2 
            className="sub-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Dorda
          </motion.h2>
          <motion.div 
            className="sparkle sparkle-2"
            animate={{ 
              rotate: [360, 180, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            ✨
          </motion.div>
        </motion.div>
        <motion.button 
          key={buttonClickCount}
          className="start-button" 
          onClick={handleStart}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1, boxShadow: "0 25px 50px rgba(251, 191, 36, 0.6)" }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            key={buttonClickCount}
            className="play-icon"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {buttonClickCount === 3 ? '❤️' : '▶'}
          </motion.span>
          <motion.span
            key={`text-${buttonClickCount}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getButtonText()}
          </motion.span>
        </motion.button>
      </div>
      <div className="floating-particles">
        {[...Array(20)].map((_, i) => {
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const randomDuration = Math.random() * 3 + 2;
          const randomDelay = Math.random() * 2;
          const randomEndY = Math.random() * 100;
          
          return (
            <motion.div
              key={i}
              className="particle"
              initial={{ 
                x: `${randomX}%`,
                y: `${randomY}%`,
                opacity: 0
              }}
              animate={{ 
                y: [`${randomY}%`, `${randomEndY}%`],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeInOut"
              }}
            />
          );
        })}
    </div>
    </motion.div>
  );

  const renderDarken = () => (
    <motion.div 
      className="stage darken-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="loader"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="loading-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        جاري التحضير...
      </motion.div>
    </motion.div>
  );

  const renderCountdown = () => (
    <motion.div 
      className="stage countdown-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="film-grain"></div>
      <div className="vignette"></div>
      <div className="countdown-container">
        <motion.div 
          className="outer-circle"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="middle-circle"
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="inner-circle"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={countdown}
              className="countdown-number"
              initial={{ scale: 1.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              {countdown}
            </motion.div>
          </AnimatePresence>
          <div className="scan-lines">
            {Array(8).fill().map((_, idx) => (
              <div key={idx} className="scan-line"></div>
            ))}
          </div>
          <div className="corner-mark corner-tl"></div>
          <div className="corner-mark corner-tr"></div>
          <div className="corner-mark corner-bl"></div>
          <div className="corner-mark corner-br"></div>
        </motion.div>
        <motion.div 
          className="pulse-ring"
          animate={{ scale: [1, 2, 2], opacity: [0.5, 0, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
      <div className="film-scratches">
        <div className="scratch scratch-1"></div>
        <div className="scratch scratch-2"></div>
      </div>
      
      {/* Countdown Password Input */}
      <motion.div
        className="countdown-password-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <form onSubmit={handleCountdownPasswordSubmit} className="countdown-password-form">
          <motion.input
            type="password"
            value={countdownPasswordInput}
            onChange={(e) => {
              setCountdownPasswordInput(e.target.value);
              setCountdownPasswordError(false);
            }}
            className={`countdown-password-input ${countdownPasswordError ? 'error' : ''}`}
            placeholder="كلمة المرور لتخطي العد التنازلي"
            autoComplete="off"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
          />
          {countdownPasswordError && (
            <motion.p
              className="countdown-password-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              كلمة المرور غير صحيحة
            </motion.p>
          )}
        </form>
      </motion.div>
    </motion.div>
  );

  const renderMontage = () => {
    if (montageIndex >= MONTAGE_IMAGES.length) return null;
    
    return (
      <div className="stage montage-stage">
        <AnimatePresence mode="wait">
          <motion.div 
            key={montageIndex}
            className="montage-image-container"
            initial={{ scale: 1.3, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
          <img 
            src={MONTAGE_IMAGES[montageIndex]} 
            alt={`Montage ${montageIndex + 1}`} 
            className="montage-image"
          />
            <motion.div 
              className="flash-overlay"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </AnimatePresence>
        <motion.div 
          className="edge-glow"
          animate={{ 
            boxShadow: [
              "inset 0 0 100px 20px rgba(250, 204, 21, 0.3)",
              "inset 0 0 150px 30px rgba(250, 204, 21, 0.5)",
              "inset 0 0 100px 20px rgba(250, 204, 21, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div 
          className="center-flash"
          animate={{ 
            scale: [0, 1.5, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.1 }}
        />
      </div>
    );
  };

  const renderQuestions = () => {
    const currentQuestion = questionsWithImages[activeQuestionIndex];
    const isLastQuestion = activeQuestionIndex === QUESTIONS.length - 1;

    return (
      <div className="stage questions-stage">
        <AnimatePresence mode="wait">
          <motion.div
          key={backgroundKey}
            className="questions-background"
          style={{ backgroundImage: `url(${currentQuestion.image})` }}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        </AnimatePresence>
        
        <Swiper
          ref={swiperRef}
          direction="vertical"
          slidesPerView={1}
          spaceBetween={0}
          speed={800}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          modules={[EffectFade, Keyboard, Mousewheel]}
          keyboard={{
            enabled: true,
            onlyInViewport: false,
          }}
          mousewheel={{
            enabled: true,
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: false,
            thresholdDelta: 50,
            thresholdTime: 500,
          }}
          allowTouchMove={true}
          allowSlidePrev={false}
          onSlideChange={handleSlideChange}
          onTouchMove={handleTouchMove}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="questions-swiper"
        >
          {questionsWithImages.map((questionData, index) => (
            <SwiperSlide key={index} className="question-slide">
              <div className="questions-container">
                <motion.div 
                  className="question-item"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <motion.h3 
                    className="question-text"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {questionData.text}
                  </motion.h3>
                  <motion.div 
                    className="question-divider"
                    initial={{ width: 0 }}
                    animate={{ width: "100px" }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                </motion.div>
                {!isLastQuestion && index === activeQuestionIndex && (
                  <motion.div 
                    className="scroll-indicator"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    ↓ استمر بالتمرير ↓
                  </motion.div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

  const renderScrollGallery = () => {
    const currentImage = currentImageIndex >= 0 && currentImageIndex < MONTAGE_IMAGES.length 
      ? MONTAGE_IMAGES[currentImageIndex] 
      : null;
    const allImagesShown = currentImageIndex >= MONTAGE_IMAGES.length - 1 && !isImageVisible;

    // Get initial position based on direction
    const getInitialPosition = () => {
      switch (imageDirection) {
        case 'bottom':
          return { y: window.innerHeight + 200, x: 0 };
        case 'top':
          return { y: -window.innerHeight - 200, x: 0 };
        case 'left':
          return { y: 0, x: -window.innerWidth - 200 };
        case 'right':
          return { y: 0, x: window.innerWidth + 200 };
        default:
          return { y: window.innerHeight + 200, x: 0 };
      }
    };

    const getExitPosition = () => {
      switch (imageDirection) {
        case 'bottom':
          return { y: -100, x: 0 };
        case 'top':
          return { y: window.innerHeight + 100, x: 0 };
        case 'left':
          return { y: 0, x: window.innerWidth + 100 };
        case 'right':
          return { y: 0, x: -window.innerWidth - 100 };
        default:
          return { y: -100, x: 0 };
      }
    };

    const initialPos = getInitialPosition();
    const exitPos = getExitPosition();

    return (
      <motion.div 
        className="stage scroll-gallery-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Disco Spotlight Effects */}
        <div className="disco-spotlights">
          <motion.div
            className="spotlight spotlight-1"
            animate={{
              x: [0, window.innerWidth * 0.3, window.innerWidth * 0.7, window.innerWidth, window.innerWidth * 0.5, 0],
              y: [0, window.innerHeight * 0.2, window.innerHeight * 0.8, window.innerHeight * 0.5, window.innerHeight * 0.3, 0],
              opacity: [0.3, 0.8, 0.4, 0.9, 0.5, 0.3],
              scale: [1, 1.5, 1.2, 1.8, 1.3, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="spotlight spotlight-2"
            animate={{
              x: [window.innerWidth, window.innerWidth * 0.7, window.innerWidth * 0.3, 0, window.innerWidth * 0.5, window.innerWidth],
              y: [window.innerHeight, window.innerHeight * 0.8, window.innerHeight * 0.2, window.innerHeight * 0.5, window.innerHeight * 0.7, window.innerHeight],
              opacity: [0.4, 0.9, 0.3, 0.7, 0.5, 0.4],
              scale: [1.2, 1.8, 1, 1.5, 1.1, 1.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="spotlight spotlight-3"
            animate={{
              x: [window.innerWidth * 0.5, 0, window.innerWidth, window.innerWidth * 0.3, window.innerWidth * 0.7, window.innerWidth * 0.5],
              y: [window.innerHeight * 0.5, window.innerHeight, 0, window.innerHeight * 0.7, window.innerHeight * 0.3, window.innerHeight * 0.5],
              opacity: [0.5, 0.7, 0.9, 0.4, 0.8, 0.5],
              scale: [1.3, 1.6, 1.1, 1.7, 1.2, 1.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="spotlight spotlight-4"
            animate={{
              x: [window.innerWidth * 0.3, window.innerWidth * 0.8, window.innerWidth * 0.2, window.innerWidth * 0.9, window.innerWidth * 0.1, window.innerWidth * 0.3],
              y: [window.innerHeight * 0.2, window.innerHeight * 0.9, window.innerHeight * 0.1, window.innerHeight * 0.8, window.innerHeight * 0.2, window.innerHeight * 0.2],
              opacity: [0.6, 0.3, 0.9, 0.4, 0.7, 0.6],
              scale: [1.4, 1.1, 1.9, 1.2, 1.6, 1.4],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Flash overlay that pulses with music */}
        <motion.div
          className="disco-flash-overlay"
          animate={{
            opacity: [0, 0.4, 0, 0.5, 0, 0.3, 0, 0.6, 0, 0.4, 0, 0.5, 0],
            background: [
              'radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.4) 0%, transparent 60%)',
              'radial-gradient(circle at 80% 70%, rgba(252, 211, 77, 0.5) 0%, transparent 60%)',
              'radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.3) 0%, transparent 60%)',
              'radial-gradient(circle at 30% 80%, rgba(251, 191, 36, 0.6) 0%, transparent 60%)',
              'radial-gradient(circle at 70% 20%, rgba(217, 119, 6, 0.4) 0%, transparent 60%)',
              'radial-gradient(circle at 60% 60%, rgba(252, 211, 77, 0.5) 0%, transparent 60%)',
              'radial-gradient(circle at 40% 40%, rgba(251, 191, 36, 0.4) 0%, transparent 60%)',
            ],
          }}
          transition={{
            opacity: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1],
            },
            background: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
        
        {/* Additional disco flash effects */}
        <motion.div
          className="disco-flash-overlay-2"
          animate={{
            opacity: [0, 0.2, 0, 0.3, 0, 0.25, 0, 0.35, 0],
            scale: [1, 1.2, 1, 1.3, 1, 1.1, 1, 1.25, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.85, 0.95, 1],
          }}
        />

        <div className="gallery-container-center">
          <AnimatePresence mode="wait">
            {isImageVisible && currentImage && (
              <motion.div
                key={currentImageIndex}
                className="gallery-image-wrapper-center"
                initial={{ 
                  y: initialPos.y,
                  x: initialPos.x,
                  opacity: 0,
                  scale: 0.5,
                  rotate: -10
                }}
                animate={{ 
                  y: 0,
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                exit={{ 
                  opacity: 0,
                  scale: 0.8,
                  y: exitPos.y,
                  x: exitPos.x,
                  rotate: 10
                }}
                transition={{ 
                  // Entrance animation
                  duration: 0.8,
                  ease: "easeOut",
                  // Exit animation
                  exit: {
                    duration: 0.5,
                    ease: "easeIn"
                  }
                }}
              >
                <motion.img
                  src={currentImage}
                  alt={`Gallery ${currentImageIndex + 1}`}
                  className="gallery-image-center"
                  initial={{ 
                    x: 0,
                    y: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    // Dancing/vibration animation - starts after entrance
                    x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0],
                    y: [0, -5, 5, -4, 4, -3, 3, -2, 2, 0],
                    rotate: [0, -3, 3, -2, 2, -1, 1, 0, 0, 0],
                  }}
                  transition={{ 
                    x: {
                      delay: 0.8,
                      duration: 2,
                      ease: "easeInOut",
                      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
                    },
                    y: {
                      delay: 0.8,
                      duration: 2,
                      ease: "easeInOut",
                      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
                    },
                    rotate: {
                      delay: 0.8,
                      duration: 2,
                      ease: "easeInOut",
                      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
                    }
                  }}
                />
                <motion.div
                  className="image-glow-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Question Overlay */}
          <AnimatePresence mode="wait">
            {showQuestion && (
              <motion.div
                key={questionStep}
                className="gallery-question-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Background Image */}
                {questionBackgrounds[questionStep === 1 ? 'step1' : 'step2'] && (
                  <motion.div
                    className="gallery-question-background"
                    style={{
                      backgroundImage: `url(${questionBackgrounds[questionStep === 1 ? 'step1' : 'step2']})`
                    }}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  />
                )}
                
                <motion.div
                  className="gallery-question-box"
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <h3 className="gallery-question-text">بتحبيني يا دوردا</h3>
                  <div className="gallery-question-buttons">
                    {questionStep === 1 ? (
                      <>
                        <motion.button
                          className="gallery-answer-button yes-button"
                          onClick={() => handleQuestionAnswer('yes')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          ايوة
                        </motion.button>
                        <motion.button
                          className="gallery-answer-button yes-button"
                          onClick={() => handleQuestionAnswer('yes')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          ايوة
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          className="gallery-answer-button yes-button"
                          onClick={() => handleQuestionAnswer('yes')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          ايوة
                        </motion.button>
                        {noButtonVisible && (
                          <motion.button
                            className="gallery-answer-button no-button"
                            onClick={() => handleQuestionAnswer('no')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            لا
                          </motion.button>
                        )}
                      </>
                    )}
            </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Final message after all images */}
          {allImagesShown && (
            <motion.div
              className="gallery-final-message"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <motion.div 
                className="final-emojis"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎉✨💛
              </motion.div>
              <motion.p 
                className="final-love-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                أحبك يا دوردا
              </motion.p>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render date waiting screen
  const renderDateWait = () => {
    const now = new Date();
    const timeUntil = RELEASE_DATE - now;
    const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <motion.div
        className="date-wait-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="date-wait-content">
          <motion.div
            className="date-wait-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ⏰
          </motion.div>
          <h1 className="date-wait-title">عقبال يوم 12 ديسمبر</h1>
          <p className="date-wait-subtitle">الموقع سيكون متاحاً قريباً</p>
          {timeUntil > 0 && (
            <div className="date-countdown">
              <div className="countdown-item">
                <span className="countdown-number">{days}</span>
                <span className="countdown-label">يوم</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{hours}</span>
                <span className="countdown-label">ساعة</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{minutes}</span>
                <span className="countdown-label">دقيقة</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render password screen
  const renderPasswordScreen = () => {
    return (
      <motion.div
        className="password-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="password-content">
          <motion.div
            className="password-icon"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🔒
          </motion.div>
          <h1 className="password-title">أدخل كلمة المرور</h1>
          <p className="password-subtitle">للدخول إلى الموقع</p>
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <motion.input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              className={`password-input ${passwordError ? 'error' : ''}`}
              placeholder="كلمة المرور"
              autoFocus
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            {passwordError && (
              <motion.p
                className="password-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                كلمة المرور غير صحيحة
              </motion.p>
            )}
            <motion.button
              type="submit"
              className="password-submit-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              دخول
            </motion.button>
          </form>
        </div>
      </motion.div>
    );
  };

  // Main render
  // Show date wait screen if date hasn't passed
  if (!isDatePassed) {
    return renderDateWait();
  }

  // Show password screen if date passed but password not entered
  if (!isPasswordCorrect) {
    return renderPasswordScreen();
  }

  // Show main website if date passed and password correct
  return (
    <>
      {/* Hidden audio elements */}
      <audio ref={countdownAudioRef} src={countdownSound} preload="auto" />
      <audio ref={imagesMovingAudioRef} src={imagesMovingSound} preload="auto" />
      <audio ref={galleryMusicRef} src={galleryMusic} preload="auto" />
      <audio ref={galleryMusic2Ref} src={galleryMusic2} preload="auto" />
      <audio ref={galleryMusic3Ref} src={galleryMusic3} preload="auto" />
      
      <AnimatePresence mode="wait">
      {(() => {
        switch (stage) {
          case STAGES.INTRO:
              return <div key="intro">{renderIntro()}</div>;
          case STAGES.DARKEN:
              return <div key="darken">{renderDarken()}</div>;
          case STAGES.COUNTDOWN:
              return <div key="countdown">{renderCountdown()}</div>;
          case STAGES.MONTAGE:
              return <div key="montage">{renderMontage()}</div>;
          case STAGES.QUESTIONS:
              return <div key="questions">{renderQuestions()}</div>;
            case STAGES.SCROLL_GALLERY:
              return <div key="scroll-gallery">{renderScrollGallery()}</div>;
          default:
              return <div key="intro">{renderIntro()}</div>;
        }
      })()}
      </AnimatePresence>
    </>
  );
};

export default Website;
