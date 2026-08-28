const particles = Array.from({ length: 70 });

export default function FloatingParticles() {

  return (

    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {particles.map((_, i) => (

        <span
          key={i}
          className="particle"
          style={{
            left: `${Math.random()*100}%`,
            top:`${Math.random()*100}%`,
            animationDelay:`${Math.random()*8}s`,
            animationDuration:`${5+Math.random()*8}s`
          }}
        />

      ))}

    </div>

  );

}