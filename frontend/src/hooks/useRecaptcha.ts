import { useState } from 'react';
// @ts-ignore
import ReCAPTCHA from "react-google-recaptcha";

const useRecaptcha = (recaptchaRef: React.RefObject<ReCAPTCHA>) => {
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

    const handleRecaptchaChange = (token: string) => {
        setRecaptchaToken(token);
    };

    const resetRecaptcha = () => {
        if (recaptchaRef.current) {
            setRecaptchaToken(null);
            recaptchaRef.current.reset();
        }
    };

    return {
        recaptchaToken,
        recaptchaSiteKey,
        handleRecaptchaChange,
        resetRecaptcha,
    };
};

export default useRecaptcha;
