import { useId } from 'react';
import type { PhotoView } from '@/domain/types';
import { cn } from '@/lib/utils';

/**
 * Ilustrações de referência (hatch compacto genérico, sem marca) usadas
 * enquanto as fotos reais não são enviadas. "stock" = como veio de fábrica;
 * "oem" = mesma base com o projeto OEM+ (mais baixo, rodas maiores,
 * vidros com película, faróis com máscara negra).
 */
export type IllustrationVariant = 'stock' | 'oem';

interface CarIllustrationProps {
  view: PhotoView;
  variant: IllustrationVariant;
  className?: string;
}

const VIEW_LABEL: Record<PhotoView, string> = {
  frente: 'frente',
  traseira: 'traseira',
  lateral: 'lateral',
  interior: 'interior',
};

export function CarIllustration({ view, variant, className }: CarIllustrationProps) {
  const uid = useId().replace(/:/g, '');
  const label = `Ilustração de referência da ${VIEW_LABEL[view]} ${variant === 'oem' ? 'com o projeto OEM+' : 'original'}`;

  return (
    <svg
      viewBox="0 0 800 600"
      role="img"
      aria-label={label}
      className={cn('h-full w-full', className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`paint-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--illus-paint-top)" />
          <stop offset="48%" stopColor="#c4cad2" />
          <stop offset="100%" stopColor="var(--illus-paint-bottom)" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={variant === 'oem' ? '#1a2027' : '#3a434d'} />
          <stop offset="100%" stopColor={variant === 'oem' ? 'var(--illus-glass-tint)' : 'var(--illus-glass)'} />
        </linearGradient>
        <linearGradient id={`cabin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334050" />
          <stop offset="100%" stopColor="#151a20" />
        </linearGradient>
        <linearGradient id={`screen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#24425f" />
          <stop offset="100%" stopColor="#0f1b2a" />
        </linearGradient>
      </defs>

      {view === 'lateral' && <SideView uid={uid} variant={variant} />}
      {view === 'frente' && <FrontView uid={uid} variant={variant} />}
      {view === 'traseira' && <RearView uid={uid} variant={variant} />}
      {view === 'interior' && <InteriorView uid={uid} variant={variant} />}
    </svg>
  );
}

interface ViewProps {
  uid: string;
  variant: IllustrationVariant;
}

/** Altura da carroceria: o OEM+ fica ~14 unidades mais baixo que o original. */
function bodyOffset(variant: IllustrationVariant): number {
  return variant === 'oem' ? 6 : -8;
}

function GroundShadow({ rx }: { rx: number }) {
  return (
    <g>
      <line x1="40" y1="478" x2="760" y2="478" stroke="#2b3138" strokeWidth="1.5" />
      <ellipse cx="400" cy="481" rx={rx} ry="9" fill="#000" opacity="0.55" />
    </g>
  );
}

/* ---------------------------------- Lateral ---------------------------------- */

function SideWheel({ cx, cy, variant }: { cx: number; cy: number; variant: IllustrationVariant }) {
  const spokes = [0, 1, 2, 3, 4];
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="0" cy="59" rx="62" ry="5" fill="#000" opacity="0.6" />
      <circle r="58" fill="var(--illus-tire)" stroke="#262b31" strokeWidth="2" />
      <circle r="51" fill="none" stroke="#1a1e23" strokeWidth="3" />
      {variant === 'stock' ? (
        <g>
          <circle r="34" fill="#8e96a1" />
          <circle r="31" fill="#b3bac3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect key={angle} x="-3" y="-27" width="6" height="13" rx="3" fill="#6c7480" transform={`rotate(${angle})`} />
          ))}
          <circle r="7" fill="#7b838e" />
        </g>
      ) : (
        <g>
          <circle r="41" fill="#14171b" />
          <circle r="32" fill="#3b4149" />
          {spokes.map((index) =>
            [-6, 6].map((offset) => (
              <path
                key={`${index}-${offset}`}
                d="M -3 -10 L -2.2 -39 L 2.2 -39 L 3 -10 Z"
                fill="#c9ced6"
                transform={`rotate(${index * 72 + offset})`}
              />
            )),
          )}
          <circle r="41" fill="none" stroke="#d3d8de" strokeWidth="3.5" />
          <circle r="10" fill="#d6dbe1" />
          <circle r="4" fill="#8f97a2" />
        </g>
      )}
    </g>
  );
}

function SideView({ uid, variant }: ViewProps) {
  const oem = variant === 'oem';
  return (
    <g>
      <GroundShadow rx={330} />
      <SideWheel cx={218} cy={420} variant={variant} />
      <SideWheel cx={584} cy={420} variant={variant} />

      <g transform={`translate(0 ${bodyOffset(variant)})`}>
        <path
          d="M 96 418 C 92 400 92 380 100 366 L 112 350 C 150 338 230 330 302 326 L 318 324 C 345 290 372 250 402 226 C 420 214 440 210 470 209 L 628 208 C 650 208 664 214 672 226 C 684 250 694 282 700 312 L 708 360 C 712 384 712 404 708 420 L 702 432 L 657 432 A 74 74 0 1 0 511 432 L 291 432 A 74 74 0 1 0 145 432 L 120 432 C 106 432 98 428 96 418 Z"
          fill={`url(#paint-${uid})`}
          stroke="var(--illus-line)"
          strokeWidth="1.5"
        />
        {/* Vidros e colunas */}
        <path
          d="M 332 324 C 354 292 378 258 406 236 C 420 226 438 222 464 221 L 620 220 C 638 220 650 226 658 238 L 678 296 C 681 303 678 307 671 307 Z"
          fill={`url(#glass-${uid})`}
        />
        <path d="M 420 232 L 470 224 L 404 318 L 372 320 Z" fill="#fff" opacity={oem ? 0.05 : 0.1} />
        <rect x="496" y="219" width="14" height="97" fill="var(--illus-trim)" />
        <path d="M 604 220 L 614 220 L 622 309 L 612 310 Z" fill="var(--illus-trim)" />
        {/* Vincos e portas */}
        <path d="M 108 374 C 260 366 520 358 706 350" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M 338 326 C 334 360 333 392 336 428" fill="none" stroke="#6f7883" strokeWidth="1.5" />
        <path d="M 503 316 L 503 430" fill="none" stroke="#6f7883" strokeWidth="1.5" />
        <path d="M 650 309 C 653 336 656 356 660 372" fill="none" stroke="#6f7883" strokeWidth="1.5" />
        <rect x="446" y="340" width="32" height="7" rx="3.5" fill="#8c949e" />
        <rect x="590" y="335" width="32" height="7" rx="3.5" fill="#8c949e" />
        <path d="M 326 322 C 330 306 352 300 364 305 L 366 318 C 352 322 338 324 326 322 Z" fill={`url(#paint-${uid})`} stroke="var(--illus-line)" />
        {/* Faróis, lanternas e para-choques */}
        <path
          d="M 101 366 L 113 351 C 131 346 151 344 167 345 C 171 353 169 363 160 369 C 140 372 118 372 101 366 Z"
          fill={oem ? '#15191e' : '#dfe4ea'}
          stroke="var(--illus-line)"
        />
        <circle cx="141" cy="358" r={oem ? 6 : 7} fill={oem ? '#eef2f6' : '#f7f9fb'} />
        <path d="M 104 404 C 130 409 170 409 198 404" fill="none" stroke="var(--illus-trim)" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M 699 312 L 707 356 C 699 361 690 359 684 352 C 683 336 687 322 693 312 Z"
          fill={oem ? '#8f1d26' : '#b85b60'}
          stroke="var(--illus-line)"
        />
        {oem && <path d="M 694 318 L 700 350" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" />}
        <rect x="692" y="404" width="12" height="5" rx="2" fill="#7a2329" />
      </g>
    </g>
  );
}

/* ---------------------------------- Frente ---------------------------------- */

function FrontView({ uid, variant }: ViewProps) {
  const oem = variant === 'oem';
  return (
    <g>
      <GroundShadow rx={250} />
      <rect x="192" y="396" width="60" height="82" rx="10" fill="var(--illus-tire)" />
      <rect x="548" y="396" width="60" height="82" rx="10" fill="var(--illus-tire)" />

      <g transform={`translate(0 ${bodyOffset(variant)})`}>
        <path
          d="M 214 332 L 252 192 C 256 178 266 170 280 170 L 520 170 C 534 170 544 178 548 192 L 586 332 Z"
          fill={`url(#paint-${uid})`}
          stroke="var(--illus-line)"
          strokeWidth="1.5"
        />
        <path
          d="M 233 322 L 265 198 C 268 188 275 184 285 184 L 515 184 C 525 184 532 188 535 198 L 567 322 Z"
          fill={`url(#glass-${uid})`}
        />
        {oem && (
          <path
            d="M 262 210 L 538 210 L 535 198 C 532 188 525 184 515 184 L 285 184 C 275 184 268 188 265 198 Z"
            fill="#05080a"
            opacity="0.75"
          />
        )}
        <path d="M 300 318 L 392 304 M 404 318 L 496 304" stroke="#0d0f12" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M 196 452 L 604 452 C 616 452 622 444 622 432 L 624 352 C 624 338 616 330 604 328 L 196 328 C 184 330 176 338 176 352 L 178 432 C 178 444 184 452 196 452 Z"
          fill={`url(#paint-${uid})`}
          stroke="var(--illus-line)"
          strokeWidth="1.5"
        />
        <path d="M 232 334 C 320 324 480 324 568 334" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M 178 314 C 160 308 146 314 144 326 C 144 336 154 340 170 338 L 188 332 Z" fill={`url(#paint-${uid})`} stroke="var(--illus-line)" />
        <path d="M 622 314 C 640 308 654 314 656 326 C 656 336 646 340 630 338 L 612 332 Z" fill={`url(#paint-${uid})`} stroke="var(--illus-line)" />

        {/* Faróis */}
        {[
          'M 190 352 C 206 344 262 341 318 345 L 330 361 C 326 374 314 382 298 383 L 210 385 C 197 385 189 377 189 365 Z',
          'M 610 352 C 594 344 538 341 482 345 L 470 361 C 474 374 486 382 502 383 L 590 385 C 603 385 611 377 611 365 Z',
        ].map((d) => (
          <path key={d} d={d} fill={oem ? '#14181c' : '#dde2e8'} stroke="var(--illus-line)" />
        ))}
        {[
          [232, 364, 11],
          [285, 364, 9],
          [568, 364, 11],
          [515, 364, 9],
        ].map(([cx = 0, cy = 0, r = 0]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={oem ? r - 2 : r}
            fill={oem ? '#e9edf1' : '#f4f6f8'}
            stroke={oem ? '#2b3138' : '#aab2bc'}
          />
        ))}
        {oem && (
          <path d="M 214 376 L 300 374 M 586 376 L 500 374" stroke="#f4f7fa" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        )}

        {/* Grade, placa e tomada inferior */}
        <path d="M 338 352 L 462 352 L 456 378 L 344 378 Z" fill="var(--illus-trim)" />
        <path d="M 344 360 L 456 360 M 346 369 L 454 369" stroke={oem ? '#2a2f35' : '#8f97a2'} strokeWidth="2.5" />
        <rect x="352" y="392" width="96" height="22" rx="3" fill="#e8ebee" />
        <path
          d="M 286 422 L 514 422 C 510 438 500 446 486 446 L 314 446 C 300 446 290 438 286 422 Z"
          fill="var(--illus-trim)"
        />
        {oem ? (
          <g>
            <circle cx="306" cy="434" r="8" fill="#e9edf1" stroke="#0d0f12" strokeWidth="2" />
            <circle cx="494" cy="434" r="8" fill="#e9edf1" stroke="#0d0f12" strokeWidth="2" />
          </g>
        ) : (
          <path d="M 320 434 L 480 434" stroke="#2a2f35" strokeWidth="3" />
        )}
      </g>
    </g>
  );
}

/* --------------------------------- Traseira --------------------------------- */

function RearView({ uid, variant }: ViewProps) {
  const oem = variant === 'oem';
  const lensFill = oem ? '#9b1c27' : '#b85b60';
  return (
    <g>
      <GroundShadow rx={250} />
      <rect x="192" y="396" width="60" height="82" rx="10" fill="var(--illus-tire)" />
      <rect x="548" y="396" width="60" height="82" rx="10" fill="var(--illus-tire)" />

      <g transform={`translate(0 ${bodyOffset(variant)})`}>
        <path
          d="M 214 332 L 252 192 C 256 178 266 170 280 170 L 520 170 C 534 170 544 178 548 192 L 586 332 Z"
          fill={`url(#paint-${uid})`}
          stroke="var(--illus-line)"
          strokeWidth="1.5"
        />
        <path
          d="M 244 314 L 270 206 C 273 196 280 190 290 190 L 510 190 C 520 190 527 196 530 206 L 556 314 Z"
          fill={`url(#glass-${uid})`}
        />
        <path d="M 262 176 L 538 176 C 544 176 548 180 546 186 L 254 186 C 252 180 256 176 262 176 Z" fill="var(--illus-trim)" />
        <rect x="370" y="178" width="60" height="5" rx="2" fill="#b0343a" />
        <path d="M 400 300 L 330 270" stroke="#0d0f12" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M 196 452 L 604 452 C 616 452 622 444 622 432 L 624 352 C 624 338 616 330 604 328 L 196 328 C 184 330 176 338 176 352 L 178 432 C 178 444 184 452 196 452 Z"
          fill={`url(#paint-${uid})`}
          stroke="var(--illus-line)"
          strokeWidth="1.5"
        />
        <path d="M 178 314 C 160 308 146 314 144 326 C 144 336 154 340 170 338 L 188 332 Z" fill={`url(#paint-${uid})`} stroke="var(--illus-line)" />
        <path d="M 622 314 C 640 308 654 314 656 326 C 656 336 646 340 630 338 L 612 332 Z" fill={`url(#paint-${uid})`} stroke="var(--illus-line)" />

        {/* Lanternas */}
        {[
          'M 182 338 L 238 338 C 246 338 250 344 250 352 L 250 392 C 250 400 244 404 236 404 L 192 404 C 184 404 180 398 180 390 L 180 344 C 180 340 181 338 182 338 Z',
          'M 618 338 L 562 338 C 554 338 550 344 550 352 L 550 392 C 550 400 556 404 564 404 L 608 404 C 616 404 620 398 620 390 L 620 344 C 620 340 619 338 618 338 Z',
        ].map((d) => (
          <path key={d} d={d} fill={lensFill} stroke="var(--illus-line)" />
        ))}
        <rect x="188" y="380" width="54" height="10" rx="2" fill={oem ? '#d9dee5' : '#cfc7bf'} opacity="0.85" />
        <rect x="558" y="380" width="54" height="10" rx="2" fill={oem ? '#d9dee5' : '#cfc7bf'} opacity="0.85" />
        {oem && (
          <path d="M 190 350 L 240 350 M 560 350 L 610 350" stroke="#ff5a5f" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Tampa, placa e para-choque */}
        <rect x="360" y="338" width="80" height="6" rx="3" fill="#8f97a2" />
        <rect x="344" y="350" width="112" height="32" rx="4" fill="var(--illus-trim)" />
        <rect x="352" y="355" width="96" height="22" rx="3" fill="#e8ebee" />
        <path d="M 196 420 L 604 420" stroke="#6f7883" strokeWidth="1.5" />
        <rect x="196" y="426" width="26" height="6" rx="3" fill="#7a2329" />
        <rect x="578" y="426" width="26" height="6" rx="3" fill="#7a2329" />
        <ellipse cx="246" cy="452" rx="12" ry="6" fill="#0d0f12" stroke="#6c7480" strokeWidth="2" />
      </g>
    </g>
  );
}

/* --------------------------------- Interior --------------------------------- */

function InteriorView({ uid, variant }: ViewProps) {
  const oem = variant === 'oem';
  return (
    <g>
      <rect width="800" height="600" fill={`url(#cabin-${uid})`} />
      <path d="M 0 0 L 70 0 L 30 210 L 0 230 Z" fill="#121519" />
      <path d="M 800 0 L 730 0 L 770 210 L 800 230 Z" fill="#121519" />

      {/* Painel */}
      <path d="M 0 214 C 120 178 280 164 400 164 C 520 164 680 178 800 214 L 800 600 L 0 600 Z" fill="#1d2126" />
      <path d="M 0 214 C 120 178 280 164 400 164 C 520 164 680 178 800 214" fill="none" stroke="#2f353d" strokeWidth="3" />
      <path d="M 0 330 C 160 320 300 316 400 316 C 500 316 640 320 800 330 L 800 600 L 0 600 Z" fill="#16191d" />
      <path d="M 620 360 C 680 360 740 366 800 376" fill="none" stroke="#2b3138" strokeWidth="2" />

      {/* Difusores laterais */}
      {[78, 722].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="268" r="28" fill="#0f1114" stroke="#2b3138" strokeWidth="3" />
          <path d={`M ${cx - 18} 268 L ${cx + 18} 268 M ${cx} 250 L ${cx} 286`} stroke="#2b3138" strokeWidth="3" />
        </g>
      ))}

      {/* Quadro de instrumentos */}
      <path d="M 128 240 C 160 196 340 196 372 240 L 364 300 L 136 300 Z" fill="#111316" />
      {[205, 295].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="262" r="32" fill="#0b0d10" stroke="#8c949e" strokeWidth="2" />
          <path d={`M ${cx} 262 L ${cx - 18} 248`} stroke="#d9dee5" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy="262" r="3" fill="#d9dee5" />
        </g>
      ))}

      {/* Console central */}
      <path d="M 430 236 L 590 236 L 600 470 L 420 470 Z" fill="#181b1f" />
      {[448, 512].map((x) => (
        <g key={x}>
          <rect x={x} y="248" width="60" height="26" rx="6" fill="#0f1114" />
          <path d={`M ${x + 6} 256 L ${x + 54} 256 M ${x + 6} 266 L ${x + 54} 266`} stroke="#2b3138" strokeWidth="2" />
        </g>
      ))}
      {oem ? (
        <g>
          <rect x="446" y="288" width="128" height="78" rx="8" fill="#07090b" stroke="#3a4048" />
          <rect x="452" y="294" width="116" height="66" rx="5" fill={`url(#screen-${uid})`} />
          <rect x="460" y="302" width="44" height="24" rx="3" fill="#d9dee5" opacity="0.2" />
          <rect x="510" y="302" width="50" height="24" rx="3" fill="#d9dee5" opacity="0.12" />
          <rect x="460" y="332" width="100" height="20" rx="3" fill="#d9dee5" opacity="0.1" />
        </g>
      ) : (
        <g>
          <rect x="452" y="300" width="116" height="36" rx="4" fill="#0e1013" stroke="#3a4048" />
          <rect x="478" y="308" width="64" height="12" rx="2" fill="#2b4a3a" />
          <circle cx="464" cy="318" r="8" fill="#1d2126" stroke="#4a525d" />
          <circle cx="556" cy="318" r="8" fill="#1d2126" stroke="#4a525d" />
        </g>
      )}
      {[470, 510, 550].map((cx) => (
        <circle key={cx} cx={cx} cy="400" r="14" fill="#111316" stroke="#3a4048" strokeWidth="2" />
      ))}

      {/* Seletor do câmbio automatizado */}
      <path d="M 440 600 L 470 480 L 570 480 L 600 600 Z" fill="#121418" />
      <ellipse cx="520" cy="522" rx="30" ry="16" fill="#1b1e22" />
      <ellipse cx="520" cy="500" rx="18" ry="22" fill={oem ? '#15181b' : '#2b3036'} />
      {oem && (
        <g>
          <ellipse cx="520" cy="500" rx="14" ry="18" fill="none" stroke="#8a929c" strokeWidth="1.2" strokeDasharray="2 4" />
          <ellipse cx="520" cy="520" rx="20" ry="6" fill="none" stroke="#cfd4db" strokeWidth="2" />
        </g>
      )}

      {/* Volante */}
      <circle cx="250" cy="412" r="124" fill="none" stroke={oem ? '#121417' : 'var(--illus-trim)'} strokeWidth="20" />
      {oem && (
        <circle cx="250" cy="412" r="124" fill="none" stroke="#8a929c" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.8" />
      )}
      {oem ? (
        <g>
          <path d="M 128 404 L 206 392 L 206 432 L 134 430 Z" fill="#1f2328" />
          <path d="M 372 404 L 294 392 L 294 432 L 366 430 Z" fill="#1f2328" />
          <path d="M 236 448 L 264 448 L 258 532 L 242 532 Z" fill="#1f2328" />
          <path d="M 247 452 L 253 452 L 252 528 L 248 528 Z" fill="#cfd4db" opacity="0.6" />
          {[150, 172, 328, 350].map((x) => (
            <rect key={x} x={x - 7} y="404" width="14" height="10" rx="3" fill="#3a4048" />
          ))}
          <rect x="206" y="378" width="88" height="70" rx="26" fill="#1a1d21" />
        </g>
      ) : (
        <g>
          <path d="M 132 400 L 200 396 L 200 430 L 136 424 Z" fill="#23282e" />
          <path d="M 368 400 L 300 396 L 300 430 L 364 424 Z" fill="#23282e" />
          <path d="M 230 454 L 270 454 L 262 530 L 238 530 Z" fill="#23282e" />
          <rect x="200" y="380" width="100" height="74" rx="22" fill="#23282e" />
        </g>
      )}
    </g>
  );
}
