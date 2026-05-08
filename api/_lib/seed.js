// Seed data — used when KV is empty (first deploy). Mirrors the defaults in script.js.
export const SEED = {
  timetable: {
    odd: [
      // Mon
      [
        { label: '—',              span: 3,  style: 'empty' },
        { label: 'ADMT',           span: 2,  style: 'admt'  },
        { label: 'S&W',            span: 3,  style: 'sw'    },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'MATH',           span: 2,  style: 'math'  },
        { label: 'SCI',            span: 3,  style: 'sci'   },
        { label: 'EL',             span: 3,  style: 'el'    },
        { label: 'CCE / Assembly', span: 3,  style: 'cce'   },
        { label: '—',              span: 9,  style: 'empty' }
      ],
      // Tue
      [
        { label: 'EL',             span: 2,  style: 'el'    },
        { label: 'Chinese',        span: 3,  style: 'mt'    },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'ADMT',           span: 3,  style: 'admt'  },
        { label: 'Humanities',     span: 3,  style: 'hum'   },
        { label: 'MATH',           span: 3,  style: 'math'  },
        { label: '—',              span: 14, style: 'empty' }
      ],
      // Wed
      [
        { label: '—',              span: 1,  style: 'empty' },
        { label: 'EL',             span: 2,  style: 'el'    },
        { label: 'Humanities',     span: 2,  style: 'hum'   },
        { label: 'Chinese',        span: 3,  style: 'mt'    },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'MATH',           span: 2,  style: 'math'  },
        { label: 'SCI',            span: 3,  style: 'sci'   },
        { label: 'CCE / Assembly', span: 3,  style: 'cce'   },
        { label: '—',              span: 12, style: 'empty' }
      ],
      // Thu — HBL
      [
        { label: 'HBL',            span: 30, style: 'hbl'   }
      ],
      // Fri
      [
        { label: 'S&W',            span: 3,  style: 'sw'    },
        { label: 'SCI',            span: 4,  style: 'sci'   },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'Chinese',        span: 2,  style: 'mt'    },
        { label: 'ICT',            span: 3,  style: 'ict'   },
        { label: '—',              span: 16, style: 'empty' }
      ]
    ],
    even: [
      // Mon
      [
        { label: '—',              span: 3,  style: 'empty' },
        { label: 'EL',             span: 3,  style: 'el'    },
        { label: 'SCI',            span: 2,  style: 'sci'   },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'Chinese',        span: 2,  style: 'mt'    },
        { label: 'S&W',            span: 3,  style: 'sw'    },
        { label: 'ADMT',           span: 3,  style: 'admt'  },
        { label: 'CCE / Assembly', span: 3,  style: 'cce'   },
        { label: '—',              span: 9,  style: 'empty' }
      ],
      // Tue
      [
        { label: 'SCI',            span: 2,  style: 'sci'   },
        { label: 'MATH',           span: 3,  style: 'math'  },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'Humanities',     span: 3,  style: 'hum'   },
        { label: 'EL',             span: 3,  style: 'el'    },
        { label: 'Chinese',        span: 3,  style: 'mt'    },
        { label: '—',              span: 14, style: 'empty' }
      ],
      // Wed
      [
        { label: '—',              span: 1,  style: 'empty' },
        { label: 'Chinese',        span: 3,  style: 'mt'    },
        { label: 'MATH',           span: 2,  style: 'math'  },
        { label: 'ADMT',           span: 2,  style: 'admt'  },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'SCI',            span: 3,  style: 'sci'   },
        { label: 'EL',             span: 3,  style: 'el'    },
        { label: 'CCE / Assembly', span: 3,  style: 'cce'   },
        { label: '—',              span: 11, style: 'empty' }
      ],
      // Thu
      [
        { label: '—',              span: 3,  style: 'empty' },
        { label: 'S&W',            span: 3,  style: 'sw'    },
        { label: 'ADMT',           span: 2,  style: 'admt'  },
        { label: 'ICT',            span: 2,  style: 'ict'   },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'MATH',           span: 3,  style: 'math'  },
        { label: 'EL',             span: 3,  style: 'el'    },
        { label: 'Humanities',     span: 3,  style: 'hum'   },
        { label: '—',              span: 9,  style: 'empty' }
      ],
      // Fri
      [
        { label: 'Chinese',        span: 3,  style: 'mt'    },
        { label: 'ICT',            span: 2,  style: 'ict'   },
        { label: 'Humanities',     span: 2,  style: 'hum'   },
        { label: 'BREAK',          span: 2,  style: 'brk'   },
        { label: 'SCI',            span: 3,  style: 'sci'   },
        { label: 'MATH',           span: 2,  style: 'math'  },
        { label: '—',              span: 16, style: 'empty' }
      ]
    ]
  },
  exams: [
    { label: 'T2 CA · MATH', date: '2026-05-12' },
    { label: 'T2 CA · SCI',  date: '2026-05-13' },
    { label: 'T2 CA · EL',   date: '2026-05-15' },
    { label: 'T2 CA · HUM',  date: '2026-05-19' },
    { label: 'T2 CA · CL',   date: '2026-05-20' }
  ]
}
