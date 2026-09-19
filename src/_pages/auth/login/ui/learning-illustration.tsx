export function LearningIllustration() {
  return (
    <svg
      className="h-auto max-h-[670px] w-full max-w-[560px] overflow-visible drop-shadow-[0_28px_24px_rgba(37,99,235,0.09)]"
      viewBox="0 0 560 650"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="desk" x1="75" y1="510" x2="530" y2="612" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FBFF" />
          <stop offset="1" stopColor="#DCEBFB" />
        </linearGradient>
        <linearGradient id="screen" x1="321" y1="389" x2="474" y2="526" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FBFF" />
          <stop offset="1" stopColor="#BCD7FA" />
        </linearGradient>
        <linearGradient id="bookBlue" x1="106" y1="416" x2="330" y2="488" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2D6DD7" />
          <stop offset="1" stopColor="#82B4F3" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="15" stdDeviation="12" floodColor="#6B93C6" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle cx="326" cy="226" r="196" fill="#EAF4FF" fillOpacity="0.55" />
      <circle cx="326" cy="226" r="150" fill="#F7FBFF" fillOpacity="0.7" />

      <g opacity="0.72" stroke="#65A1EF" strokeWidth="5" strokeLinecap="round">
        <path d="M164 131L143 111" />
        <path d="M199 112L197 82" />
        <path d="M237 125L254 101" />
      </g>

      <g transform="translate(112 142) rotate(-8)">
        <path d="M3 31L74 2L149 34L77 65L3 31Z" fill="#3E7BDA" />
        <path d="M23 39V77C49 96 99 97 128 75V42L77 65L23 39Z" fill="#6A9FE9" />
        <path d="M149 34V74" stroke="#245FBF" strokeWidth="5" strokeLinecap="round" />
        <circle cx="149" cy="78" r="7" fill="#245FBF" />
        <path d="M65 28L82 35" stroke="#DCEBFF" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g opacity="0.85" fill="#5B8FDC">
        <path
          d="M343 151C343 146 347 142 352 142H372C377 142 381 146 381 151V171C381 176 377 180 372 180H352C347 180 343 176 343 171V151Z"
          fill="#DCEBFF"
        />
        <path
          d="M351 160L359 168L374 151"
          stroke="#3979D5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M416 191C416 186 420 182 425 182H445C450 182 454 186 454 191V211C454 216 450 220 445 220H425C420 220 416 216 416 211V191Z"
          fill="#E7F2FF"
        />
        <path d="M427 211V200M435 211V194M443 211V188" stroke="#3979D5" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g opacity="0.86" transform="translate(286 236) rotate(-5)">
        <path d="M0 28C36 9 78 3 119 9" stroke="#78A9E9" strokeWidth="3" strokeLinecap="round" />
        <path d="M17 50C58 29 97 28 137 33" stroke="#9DC2F1" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 71C67 58 95 55 123 58" stroke="#BCD4F3" strokeWidth="3" strokeLinecap="round" />
      </g>

      <ellipse cx="294" cy="570" rx="250" ry="39" fill="#AFC7E5" fillOpacity="0.24" />
      <path d="M48 526C149 504 400 502 522 529L500 594C381 620 165 617 61 587L48 526Z" fill="url(#desk)" />

      <g filter="url(#softShadow)">
        <path d="M96 468L306 480L299 516L89 503C80 502 75 493 78 485L80 480C83 472 89 468 96 468Z" fill="#2F6FCB" />
        <path
          d="M102 430L320 441L314 480L95 468C84 467 79 457 83 448L85 443C88 434 94 430 102 430Z"
          fill="url(#bookBlue)"
        />
        <path d="M111 391L304 400L298 438L103 429C94 429 89 420 91 412L92 406C94 397 101 391 111 391Z" fill="#EDF5FF" />
        <path d="M117 398L288 406M109 421L287 429" stroke="#B9D1ED" strokeWidth="3" strokeLinecap="round" />
        <text x="132" y="458" fill="#EAF4FF" fontSize="20" fontFamily="sans-serif">
          Развитие
        </text>
        <text x="121" y="496" fill="#EAF4FF" fontSize="20" fontFamily="sans-serif">
          Возможности
        </text>
        <text x="132" y="420" fill="#719DD2" fontSize="18" fontFamily="sans-serif">
          Знания
        </text>
      </g>

      <g filter="url(#softShadow)">
        <path d="M351 356L500 381L473 514L324 487L351 356Z" fill="#D4E5F8" />
        <path d="M360 365L488 386L465 496L337 474L360 365Z" fill="url(#screen)" />
        <circle cx="413" cy="428" r="18" fill="#EAF3FE" />
        <path
          d="M405 428L411 434L423 420"
          stroke="#4D86D8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M321 486L475 513L510 547L354 523L321 486Z" fill="#AFC8E6" />
        <path d="M354 523L510 547L498 557L342 533L354 523Z" fill="#89A9D0" />
        <path d="M377 510L453 523" stroke="#7E9FC7" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g transform="translate(445 270)">
        <path d="M22 150C4 100 2 46 25 3" stroke="#73915A" strokeWidth="7" strokeLinecap="round" />
        <path d="M24 49C-3 38-13 17 1 5C20 10 31 25 24 49Z" fill="#79A66A" />
        <path d="M23 78C50 61 69 67 71 84C55 99 38 96 23 78Z" fill="#588B58" />
        <path d="M19 110C-7 96-21 104-20 121C-2 134 12 128 19 110Z" fill="#8DB477" />
        <path d="M22 137C45 119 62 122 66 138C53 153 37 153 22 137Z" fill="#6A9A60" />
        <path d="M-3 144H56L48 202H7L-3 144Z" fill="#F2F7FC" />
        <path d="M3 154H51" stroke="#CAD9E9" strokeWidth="3" />
      </g>

      <g transform="translate(215 541) rotate(7)">
        <rect width="130" height="25" rx="12" fill="#F5F9FE" />
        <path d="M17 7H87M17 13H98M17 19H73" stroke="#C6D7EB" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(365 573) rotate(-8)">
        <rect width="118" height="13" rx="6.5" fill="#2867BE" />
        <path d="M93 0H111V13H93Z" fill="#78A5DF" />
        <path d="M118 6.5L129 2V11L118 6.5Z" fill="#193F79" />
      </g>
    </svg>
  );
}
