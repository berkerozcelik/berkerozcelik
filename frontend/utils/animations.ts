import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { theme } from '../app/theme';

// Animation Hooks
export const useSlideUpAnimation = (isVisible: boolean) => {
  const translateY = useSharedValue(isVisible ? 0 : 50);
  const opacity = useSharedValue(isVisible ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const animate = (visible: boolean) => {
    translateY.value = withSpring(visible ? 0 : 50, theme.animations.spring.gentle);
    opacity.value = withTiming(visible ? 1 : 0, { duration: theme.animations.duration.normal });
  };

  return { animatedStyle, animate };
};

export const useFadeAnimation = (isVisible: boolean = true) => {
  const opacity = useSharedValue(isVisible ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const fadeIn = () => {
    opacity.value = withTiming(1, { duration: theme.animations.duration.normal });
  };

  const fadeOut = () => {
    opacity.value = withTiming(0, { duration: theme.animations.duration.fast });
  };

  const toggle = (visible: boolean) => {
    opacity.value = withTiming(visible ? 1 : 0, { 
      duration: visible ? theme.animations.duration.normal : theme.animations.duration.fast 
    });
  };

  return { animatedStyle, fadeIn, fadeOut, toggle };
};

export const useScaleAnimation = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const scaleIn = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: theme.animations.duration.fast }),
      withSpring(1, theme.animations.spring.bouncy)
    );
  };

  const scaleOut = () => {
    scale.value = withTiming(0.95, { duration: theme.animations.duration.fast });
  };

  const bounce = () => {
    scale.value = withSequence(
      withTiming(1.05, { duration: theme.animations.duration.fast }),
      withSpring(1, theme.animations.spring.gentle)
    );
  };

  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: theme.animations.duration.fast }),
      withTiming(1, { duration: theme.animations.duration.fast })
    );
  };

  return { animatedStyle, scaleIn, scaleOut, bounce, pulse };
};

export const useSlideAnimation = (direction: 'left' | 'right' | 'up' | 'down' = 'up') => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    };
  });

  const slideIn = () => {
    const targetX = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
    const targetY = direction === 'up' ? -50 : direction === 'down' ? 50 : 0;

    translateX.value = targetX;
    translateY.value = targetY;
    opacity.value = 0;

    translateX.value = withSpring(0, theme.animations.spring.gentle);
    translateY.value = withSpring(0, theme.animations.spring.gentle);
    opacity.value = withTiming(1, { duration: theme.animations.duration.normal });
  };

  const slideOut = () => {
    const targetX = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
    const targetY = direction === 'up' ? -50 : direction === 'down' ? 50 : 0;

    translateX.value = withTiming(targetX, { duration: theme.animations.duration.fast });
    translateY.value = withTiming(targetY, { duration: theme.animations.duration.fast });
    opacity.value = withTiming(0, { duration: theme.animations.duration.fast });
  };

  return { animatedStyle, slideIn, slideOut };
};

export const useRotationAnimation = () => {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const rotate = (degrees: number = 360) => {
    rotation.value = withTiming(degrees, { duration: theme.animations.duration.slow });
  };

  const spin = () => {
    rotation.value = withSequence(
      withTiming(360, { duration: theme.animations.duration.slower }),
      withTiming(0, { duration: 0 })
    );
  };

  const wobble = () => {
    rotation.value = withSequence(
      withTiming(10, { duration: theme.animations.duration.fast }),
      withTiming(-10, { duration: theme.animations.duration.fast }),
      withTiming(5, { duration: theme.animations.duration.fast }),
      withTiming(0, { duration: theme.animations.duration.fast })
    );
  };

  return { animatedStyle, rotate, spin, wobble };
};

export const useProgressAnimation = (progress: number) => {
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  const animateProgress = (targetProgress: number) => {
    width.value = withSpring(targetProgress, theme.animations.spring.gentle);
  };

  return { animatedStyle, animateProgress };
};

export const useModalAnimation = (isVisible: boolean) => {
  const translateY = useSharedValue(isVisible ? 0 : 300);
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const backdropOpacity = useSharedValue(isVisible ? 0.5 : 0);

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const showModal = () => {
    backdropOpacity.value = withTiming(0.5, { duration: theme.animations.duration.normal });
    translateY.value = withSpring(0, theme.animations.spring.gentle);
    opacity.value = withTiming(1, { duration: theme.animations.duration.normal });
  };

  const hideModal = (callback?: () => void) => {
    backdropOpacity.value = withTiming(0, { duration: theme.animations.duration.fast });
    translateY.value = withTiming(300, { duration: theme.animations.duration.fast });
    opacity.value = withTiming(0, { 
      duration: theme.animations.duration.fast 
    }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  };

  return { modalStyle, backdropStyle, showModal, hideModal };
};

export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const animations = Array.from({ length: itemCount }, () => {
    return {
      opacity: useSharedValue(0),
      translateY: useSharedValue(30),
    };
  });

  const animatedStyles = animations.map(anim => 
    useAnimatedStyle(() => ({
      opacity: anim.opacity.value,
      transform: [{ translateY: anim.translateY.value }],
    }))
  );

  const startStaggered = () => {
    animations.forEach((anim, index) => {
      anim.opacity.value = withDelay(
        index * delay,
        withTiming(1, { duration: theme.animations.duration.normal })
      );
      anim.translateY.value = withDelay(
        index * delay,
        withSpring(0, theme.animations.spring.gentle)
      );
    });
  };

  const resetStaggered = () => {
    animations.forEach(anim => {
      anim.opacity.value = 0;
      anim.translateY.value = 30;
    });
  };

  return { animatedStyles, startStaggered, resetStaggered };
};

// Gesture-based animations
export const useSwipeAnimation = () => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = interpolate(
      Math.abs(translateX.value),
      [0, 100],
      [1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacityValue,
    };
  });

  const snapBack = () => {
    translateX.value = withSpring(0, theme.animations.spring.snappy);
    opacity.value = withTiming(1, { duration: theme.animations.duration.fast });
  };

  const swipeOut = (direction: 'left' | 'right', callback?: () => void) => {
    const target = direction === 'left' ? -300 : 300;
    translateX.value = withTiming(target, { duration: theme.animations.duration.normal });
    opacity.value = withTiming(0, { 
      duration: theme.animations.duration.normal 
    }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  };

  return { animatedStyle, snapBack, swipeOut, translateX };
};

// Loading animations
export const useLoadingAnimation = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const startLoading = () => {
    scale.value = withSequence(
      withTiming(1.2, { duration: theme.animations.duration.slow }),
      withTiming(1, { duration: theme.animations.duration.slow })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: theme.animations.duration.slow }),
      withTiming(0.5, { duration: theme.animations.duration.slow })
    );
  };

  const stopLoading = () => {
    scale.value = withTiming(1, { duration: theme.animations.duration.fast });
    opacity.value = withTiming(1, { duration: theme.animations.duration.fast });
  };

  return { animatedStyle, startLoading, stopLoading };
};

// Chart animation utilities
export const useChartAnimation = () => {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        { scale: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolate.CLAMP) }
      ],
    };
  });

  const animateIn = () => {
    progress.value = withDelay(
      200,
      withSpring(1, theme.animations.spring.gentle)
    );
  };

  const animateOut = () => {
    progress.value = withTiming(0, { duration: theme.animations.duration.fast });
  };

  return { animatedStyle, animateIn, animateOut, progress };
};