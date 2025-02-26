import { useState, useEffect, useRef } from 'react';
import './Cube.css';

//Constants for the automatic movement
const autoRotationTargetSpeed = 0.02; // deg per ms for Y rotation
const autoRotationPeriod = 20000;     // period (ms) for one full X cycle


const Cube = () => {
    //Declaring useStates
    // Rotation states, holds the current rotation angles (in degrees) for X and Y axes.
    const [rotation, setRotation] = useState({ x: 20, y: 0 });
    // Controls whether the cube rotates automatically.
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    // Stores a timestamp (in ms) marking the most recent user interaction
    const [lastInteraction, setLastInteraction] = useState(null);
    // When true, enables a CSS transition effect for smooth manual rotation.
    const [manualTransition, setManualTransition] = useState(false);

    //UseRefs
    //Holds the ID returned by requestAnimationFrame so it can be cancelled later.
    const animationRef = useRef(null);
    //Timestamp of the previous animation frame to compute time differences.
    const lastTimeRef = useRef(null);
    //Holds a timeout ID that disables manual transition after a delay.
    const manualTransitionTimeoutRef = useRef(null);
    // used to preserve X phase when pausing so that the wobble resumes smoothly.
    const phaseOffsetRef = useRef(0);       

    // This effect handles the continuous rotation of the cube when auto-rotation is enabled.
    useEffect(() => {
        // 'autoRotate' is the callback function executed on each animation frame.
        const autoRotate = (time) => {
            // If we have a previous frame time, calculate the elapsed time (delta).
            if (lastTimeRef.current !== null) {
                const delta = time - lastTimeRef.current;
                // If we have a previous frame time, calculate the elapsed time (delta).
                setRotation(prev => ({
                    // Increment the Y-axis rotation based on the target speed.
                    y: prev.y + autoRotationTargetSpeed * delta,
                    // Compute the X-axis rotation using a cosine function to create a smooth wobble effect.
                    x: 20 * Math.cos((2 * Math.PI * ((time - phaseOffsetRef.current) % autoRotationPeriod)) / autoRotationPeriod)
                }));
            }
            // Update the last frame time for the next delta calculation.
            lastTimeRef.current = time;
            // If auto-rotation is still enabled, request the next frame.
            if (isAutoRotating) {
                animationRef.current = requestAnimationFrame(autoRotate);
            }
            };
            // If auto-rotation is enabled, initialize the animation.
            if (isAutoRotating) {
                // Reset lastTimeRef so that the first delta calculation is accurate.
                lastTimeRef.current = null;
                // Start the animation loop.
                animationRef.current = requestAnimationFrame(autoRotate);
            }
            // Cleanup function: cancel the animation frame if the component unmounts or if auto-rotation is toggled.
            return () => {
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            };
        }, [isAutoRotating]);
        
    // Effect to Resume Auto-Rotation Based on User Interaction
    // When auto-rotation is paused and there was a user interaction,
    // wait 1 second, then compute the current phase from the frozen X value, force the manual CSS
    // transition off, reset the animation timestamp (with a 50ms offset), and resume auto-rotation.
    useEffect(() => {
        let timeoutId;
        if (!isAutoRotating && lastInteraction) {
            timeoutId = setTimeout(() => {
                // Compute the current phase from the frozen X value.
                // Since x = 20 * cos(phase), we compute phase = arccos(x/20).
                const frozenX = rotation.x;
                const currentPhase = Math.acos(frozenX / 20);
                // Adjust phaseOffsetRef so that autoRotate resumes smoothly from the current wobble.
                phaseOffsetRef.current = performance.now() - (currentPhase * autoRotationPeriod) / (2 * Math.PI);
                // Turn off manual transition so that auto-rotation updates instantly.
                setManualTransition(false);
                // Reset lastTimeRef so that the next delta is computed freshly (with a small offset of 50ms to make it smoother).
                lastTimeRef.current = performance.now() - 50;
                // Resume auto-rotation.
                setIsAutoRotating(true);
            }, 1000); // 1 second delay before resuming auto-rotation.
        }
        // Cleanup: clear the timeout if dependencies change or the component unmounts.
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            };
    }, [isAutoRotating, lastInteraction, rotation.x]);

    
    // Calculates the current X rotation angle based on time and phase offset,
    // then updates the state so that the cube appears "frozen" in its position.
    // Helps with a smoother start / stop of the cube. 
    const freezeRotation = () => {
        // Get the current performance time.
        const now = performance.now();
        // Calculate the frozen X rotation, similar to auto-rotation logic.
        const freezeX = 20 * Math.cos(
          (2 * Math.PI * ((now - phaseOffsetRef.current) % autoRotationPeriod)) / autoRotationPeriod
        );
        // Update the rotation state: preserve Y rotation and set X to the computed frozen value.
        setRotation(prev => ({ ...prev, x: freezeX }));
    };
    
    // Keyboard controls: when an arrow key is pressed, disable auto-rotation, updates the rotation, and applies a CSS transition.
    useEffect(() => {
        const handleKeyDown = (e) => {
            // If auto-rotation is currently active, disable it.
            if (isAutoRotating) {
                setIsAutoRotating(false);
                // Store the current frame time as the phase offset so that auto-rotation can resume smoothly later.
                if (lastTimeRef.current) {
                    phaseOffsetRef.current = lastTimeRef.current;
                }
            }
            // Record the time of this interaction.
            setLastInteraction(Date.now());
            // Enable the manual CSS transition for a smooth rotation animation.
            setManualTransition(true);
            // Check which key was pressed to determine rotation direction.
            if (e.key === 'ArrowLeft') {
                setRotation((prev) => ({ ...prev, y: prev.y - 45 }));
            } else if (e.key === 'ArrowRight') {
                setRotation((prev) => ({ ...prev, y: prev.y + 45 }));
            }
            // Clear any pending timeout, then set a new one.
            if (manualTransitionTimeoutRef.current) {
                clearTimeout(manualTransitionTimeoutRef.current);
            }
            // Set a timeout to disable the manual transition after 600ms.
            manualTransitionTimeoutRef.current = setTimeout(() => {
                setManualTransition(false);
                manualTransitionTimeoutRef.current = null;
            }, 600);
            };
            // Add the keydown event listener to the window.
            window.addEventListener('keydown', handleKeyDown);
             // Cleanup: remove the event listener and clear any pending timeout when the effect is re-run or the component unmounts.
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
            // Freeze the cube’s X rotation
            freezeRotation();
            setIsAutoRotating(false);
            // Turn off manual transition to prevent any animation effects during the pause.
            setManualTransition(false);
            // Record this interaction to later resume auto-rotation.
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
