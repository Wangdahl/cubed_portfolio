import { useState, useEffect, useRef } from 'react';
import './Cube.css';

// New constants and ref for X wobble
const autoRotationTargetSpeed = 0.02; // deg per ms for Y rotation
const autoRotationPeriod = 20000;     // period (ms) for one full X wobble cycle


const Cube = () => {
    // Rotation states.
    const [rotation, setRotation] = useState({ x: 20, y: 0 });
    // Flag controlling auto-rotation (true = continuous rotation).
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    // Timestamp of the last user interaction (for auto-resume).
    const [lastInteraction, setLastInteraction] = useState(null);
    // This flag is used to enable CSS transitions for manual (key-driven) updates.
    const [manualTransition, setManualTransition] = useState(false);

    // Ref for requestAnimationFrame ID and last timestamp.
    const animationRef = useRef(null);
    const lastTimeRef = useRef(null);
    const manualTransitionTimeoutRef = useRef(null);
    const phaseOffsetRef = useRef(0);       // used to preserve X phase when pausing

    // Auto-rotation effect (runs without CSS transition).
    useEffect(() => {
        const autoRotate = (time) => {
            if (lastTimeRef.current !== null) {
                const delta = time - lastTimeRef.current;
                setRotation(prev => ({
                y: prev.y + autoRotationTargetSpeed * delta,
                // Compute X using cosine for the wobble effect:
                x: 20 * Math.cos((2 * Math.PI * ((time - phaseOffsetRef.current) % autoRotationPeriod)) / autoRotationPeriod)
                }));
            }
            lastTimeRef.current = time;
            if (isAutoRotating) {
                animationRef.current = requestAnimationFrame(autoRotate);
            }
            };
        
            if (isAutoRotating) {
            lastTimeRef.current = null;
            animationRef.current = requestAnimationFrame(autoRotate);
            }
        
            return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            };
        }, [isAutoRotating]);
        

    // Auto-resume - set time untill resume here.
    useEffect(() => {
        let timeoutId;
        if (!isAutoRotating && lastInteraction) {
        timeoutId = setTimeout(() => {
            setIsAutoRotating(true);
        }, 1000);
        }
        return () => {
        if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isAutoRotating, lastInteraction]);

    const freezeRotation = () => {
        const now = performance.now();
        const freezeX = 20 * Math.cos(
          (2 * Math.PI * ((now - phaseOffsetRef.current) % autoRotationPeriod)) / autoRotationPeriod
        );
        setRotation(prev => ({ ...prev, x: freezeX }));
      };
      
    // Keyboard controls: when an arrow key is pressed, disable auto-rotation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isAutoRotating) {
                setIsAutoRotating(false);
                if (lastTimeRef.current) {
                    phaseOffsetRef.current = lastTimeRef.current;
                }
            }
            setLastInteraction(Date.now());
            setManualTransition(true);
            if (e.key === 'ArrowLeft') {
                setRotation((prev) => ({ ...prev, y: prev.y - 45 }));
            } else if (e.key === 'ArrowRight') {
                setRotation((prev) => ({ ...prev, y: prev.y + 45 }));
            }
            // Clear any pending timeout, then set a new one.
            if (manualTransitionTimeoutRef.current) {
                clearTimeout(manualTransitionTimeoutRef.current);
            }
            manualTransitionTimeoutRef.current = setTimeout(() => {
                setManualTransition(false);
                manualTransitionTimeoutRef.current = null;
            }, 600);
            };
        
            window.addEventListener('keydown', handleKeyDown);
            return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (manualTransitionTimeoutRef.current) {
                clearTimeout(manualTransitionTimeoutRef.current);
            }
            };
        }, [isAutoRotating]);

    // On mouse enter, pause auto-rotation immediately.
    const handleMouseEnter = () => {
        if (isAutoRotating) {
          freezeRotation();
          setIsAutoRotating(false);
          setManualTransition(false);
          // Removed updating phaseOffsetRef here.
          setLastInteraction(Date.now());
        }
      };
      

    return (
        <div className="cube-container">
        <div
            className="cube"
            style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: manualTransition
                ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
                : 'none'
            }}
            onMouseEnter={handleMouseEnter}
        >
            <div className="cube-face cube-front">Front</div>
            <div className="cube-face cube-back">Back</div>
            <div className="cube-face cube-right">Right</div>
            <div className="cube-face cube-left">Left</div>
            <div className="cube-face cube-top">Top</div>
            <div className="cube-face cube-bottom">Bottom</div>
        </div>
        </div>
    );
};

export default Cube;
