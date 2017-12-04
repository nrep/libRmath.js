'use strict';

const { trunc } = Math;
const frac = (x: number) => x - trunc(x);

import { warning, error } from '../../_logging';
import { IRNGType } from '../irng-type';
import { timeseed } from '../timeseed';
import { IRNG } from '../IRNG';
import { fixup } from '../fixup';

const SEED_LEN = 6;
const a12 = 1403580; //least 64 bits
const a13n = 810728;
const m2 = 4294944443;
const m1 = 4294967087;
const normc = 2.328306549295727688e-10;
const a21 = 527612;
const a23n = 1370589;

export class LecuyerCMRG extends IRNG {
  private kind: IRNGType;
  private name: string;
  private m_seed: Int32Array;


  constructor(_seed: number = timeseed()) {
    super(_seed);
  }

  public _setup() {
    this.kind = IRNGType.LECUYER_CMRG;
    this.name = "L'Ecuyer-CMRG";
    this.m_seed = new Int32Array(SEED_LEN).fill(0);
  }

  public init(se: number) {
    /* Initial scrambling */
    const s = new Int32Array([0]);

    s[0] = se;
    for (let j = 0; j < 50; j++) {
      s[0] = 69069 * s[0] + 1;
    }
    for (let j = 0; j < this.m_seed.length; j++) {
      s[0] = 69069 * s[0] + 1;
      while (s[0] >= m2) {
        s[0] = 69069 * s[0] + 1;
      }

      this.m_seed[j] = s[0];
    }
  }

  public unif_rand(): number {
    const II = this.m_seed;

    const { trunc, pow } = Math;
    const pp2 = pow.bind(pow, 2);
    const break32 = pp2(32);

    let k;
    let p1;
    let p2;

    p1 = a12 * new Uint32Array([II[1]])[0] - a13n * new Uint32Array([II[0]])[0];
    //here, p1 is around 50 bits, worst case
    k = new Int32Array([p1 / m1])[0];
    // here because k is capped to be 32 bits signed

    p1 -= k * m1;
    // here k*m1 is around 32*32 is 64 bits

    if (p1 < 0.0) p1 += m1;

    II[0] = II[1];
    II[1] = II[2];
    II[2] = new Int32Array([p1])[0];

    p2 = a21 * new Uint32Array([II[5]])[0] - a23n * new Uint32Array([II[3]])[0];

    k = new Int32Array([p2 / m2])[0];
    p2 -= k * m2;
    if (p2 < 0.0) p2 += m2;
    II[3] = II[4];
    II[4] = II[5];
    II[5] = new Int32Array([p2])[0];

    return (p1 > p2 ? p1 - p2 : p1 - p2 + m1) * normc;
  }

  public set seed(_seed: number[]) {
    let errors = 0;

    if (_seed.length > this.m_seed.length || _seed.length === 0) {
      this.init(timeseed());
      return;
    }
    this.m_seed.set(_seed);
  }

  public get seed() {
    return Array.from(this.m_seed);
  }
}
