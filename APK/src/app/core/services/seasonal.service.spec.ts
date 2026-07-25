import { TestBed } from '@angular/core/testing';
import { SeasonalService } from './seasonal.service';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('SeasonalService', () => {
  let s: SeasonalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    s = TestBed.inject(SeasonalService);
  });

  describe('domingoDePascoa', () => {
    // Datas reais conferidas contra calendário litúrgico.
    const esperado: Record<number, string> = {
      2024: '2024-03-31',
      2025: '2025-04-20',
      2026: '2026-04-05',
      2027: '2027-03-28',
      2028: '2028-04-16',
      2029: '2029-04-01',
      2030: '2030-04-21',
      2031: '2031-04-13',
      2032: '2032-03-28',
    };

    Object.entries(esperado).forEach(([ano, data]) => {
      it(`calcula ${ano} como ${data}`, () => {
        expect(iso(s.domingoDePascoa(Number(ano)))).toBe(data);
      });
    });

    it('sempre cai num domingo', () => {
      for (let ano = 2024; ano <= 2040; ano++) {
        expect(s.domingoDePascoa(ano).getDay()).toBe(0);
      }
    });
  });

  describe('thanksgiving', () => {
    const esperado: Record<number, string> = {
      2024: '2024-11-28',
      2025: '2025-11-27',
      2026: '2026-11-26',
      2027: '2027-11-25',
      2028: '2028-11-23',
    };

    Object.entries(esperado).forEach(([ano, data]) => {
      it(`calcula ${ano} como ${data}`, () => {
        expect(iso(s.thanksgiving(Number(ano)))).toBe(data);
      });
    });

    it('sempre cai numa quinta-feira de novembro', () => {
      for (let ano = 2024; ano <= 2040; ano++) {
        const d = s.thanksgiving(ano);
        expect(d.getDay()).toBe(4);
        expect(d.getMonth()).toBe(10);
        expect(d.getDate()).toBeGreaterThanOrEqual(22);
        expect(d.getDate()).toBeLessThanOrEqual(28);
      }
    });
  });

  describe('carnaval', () => {
    it('cai na terça-feira esperada', () => {
      const esperado: Record<number, string> = {
        2024: '2024-02-13',
        2025: '2025-03-04',
        2026: '2026-02-17',
        2027: '2027-02-09',
        2028: '2028-02-29', // ano bissexto
      };
      Object.entries(esperado).forEach(([ano, data]) => {
        const d = s.carnaval(Number(ano));
        expect(iso(d)).toBe(data);
        expect(d.getDay()).toBe(2);
      });
    });
  });

  describe('temaDaData', () => {
    it('usa o padrão fora de qualquer janela', () => {
      expect(s.temaDaData(new Date(2026, 7, 15), 'pt')).toBe('standard');
    });

    it('aplica Natal em dezembro para qualquer idioma', () => {
      for (const idioma of ['pt', 'en', 'de'] as const) {
        expect(s.temaDaData(new Date(2026, 11, 10), idioma)).toBe('natalino');
      }
    });

    it('aplica Halloween entre 24 e 31 de outubro', () => {
      expect(s.temaDaData(new Date(2026, 9, 23), 'pt')).toBe('standard');
      expect(s.temaDaData(new Date(2026, 9, 24), 'pt')).toBe('halloween');
      expect(s.temaDaData(new Date(2026, 9, 31), 'pt')).toBe('halloween');
      expect(s.temaDaData(new Date(2026, 10, 1), 'pt')).toBe('standard');
    });

    it('aplica Páscoa na janela de -7/+1 dias', () => {
      const pascoa2026 = new Date(2026, 3, 5);
      const dia = (delta: number) =>
        new Date(2026, 3, pascoa2026.getDate() + delta);
      expect(s.temaDaData(dia(-8), 'pt')).toBe('standard');
      expect(s.temaDaData(dia(-7), 'pt')).toBe('pascoa');
      expect(s.temaDaData(dia(0), 'pt')).toBe('pascoa');
      expect(s.temaDaData(dia(1), 'pt')).toBe('pascoa');
      expect(s.temaDaData(dia(2), 'pt')).toBe('standard');
    });

    describe('temas restritos por idioma', () => {
      it('Festa Junina entra apenas em PT', () => {
        expect(s.temaDaData(new Date(2026, 5, 15), 'pt')).toBe('festejunina');
        expect(s.temaDaData(new Date(2026, 5, 15), 'en')).toBe('standard');
        expect(s.temaDaData(new Date(2026, 5, 15), 'es')).toBe('standard');
      });

      it('Festa Junina cobre o mês inteiro de junho', () => {
        expect(s.temaDaData(new Date(2026, 4, 31), 'pt')).toBe('standard');
        expect(s.temaDaData(new Date(2026, 5, 1), 'pt')).toBe('festejunina');
        expect(s.temaDaData(new Date(2026, 5, 30), 'pt')).toBe('festejunina');
        expect(s.temaDaData(new Date(2026, 6, 1), 'pt')).toBe('standard');
      });

      it('Thanksgiving entra apenas em EN', () => {
        const dia = s.thanksgiving(2026); // 26/11/2026
        expect(s.temaDaData(dia, 'en')).toBe('thanksgiving');
        expect(s.temaDaData(dia, 'pt')).toBe('standard');
      });

      it('Thanksgiving cobre os 7 dias anteriores', () => {
        const d = s.thanksgiving(2026);
        const antes = new Date(2026, 10, d.getDate() - 7);
        const muitoAntes = new Date(2026, 10, d.getDate() - 8);
        const depois = new Date(2026, 10, d.getDate() + 1);
        expect(s.temaDaData(antes, 'en')).toBe('thanksgiving');
        expect(s.temaDaData(muitoAntes, 'en')).toBe('standard');
        expect(s.temaDaData(depois, 'en')).toBe('standard');
      });
    });

    describe('bordas', () => {
      it('trata a virada de ano', () => {
        expect(s.temaDaData(new Date(2026, 11, 31), 'pt')).toBe('natalino');
        expect(s.temaDaData(new Date(2027, 0, 1), 'pt')).toBe('standard');
      });

      it('funciona em ano bissexto', () => {
        expect(s.temaDaData(new Date(2028, 1, 29), 'pt')).toBe('standard');
        expect(iso(s.carnaval(2028))).toBe('2028-02-29');
      });

      it('não deixa Festa Junina e Thanksgiving coexistirem', () => {
        // junho x novembro — nunca simultâneos
        expect(s.temaDaData(new Date(2026, 5, 15), 'en')).toBe('standard');
        expect(s.temaDaData(s.thanksgiving(2026), 'pt')).toBe('standard');
      });

      it('cobre todos os dias de 2026 sem lançar erro', () => {
        const d = new Date(2026, 0, 1);
        while (d.getFullYear() === 2026) {
          expect(() => s.temaDaData(new Date(d), 'pt')).not.toThrow();
          d.setDate(d.getDate() + 1);
        }
      });
    });
  });
});
