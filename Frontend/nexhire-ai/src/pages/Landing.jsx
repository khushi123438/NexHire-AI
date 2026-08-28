import Hero from "../components/landing/Hero";

import AuroraBackground from "../components/background/AuroraBackground";
import AnimatedGrid from "../components/background/GridBackground";
import FloatingParticles from "../components/background/Floating";

import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import AIInterview from "../components/landing/AIInterview";
import Evaluation from "../components/landing/Evaluation";
import RecruiterDecision from "../components/landing/RecruiterDecision";
import Footer from "../components/layout/Footer";

export default function Landing() {

return(

<div className="relative bg-[#050505] text-white overflow-hidden min-h-screen">

<AuroraBackground/>

<AnimatedGrid/>

<FloatingParticles/>

<div className="relative z-10">



<Hero />
<Features />
<HowItWorks />
<AIInterview />
<Evaluation />
<RecruiterDecision />
<Footer />

</div>

</div>

)

}