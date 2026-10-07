// Data Literacy — PUBLIC bank. Contains no answers; keys live in data-literacy.keys.js
// (server-only). Plain ESM, zero imports.
//
// Tiers per subskill, in order: F, F, W, W, A  (Foundational x2, Working x2, Advanced x1).
// Option ids are stable (a-d); the UI shuffles display order per run.

export default {
  slug: 'data-literacy',
  version: 1,
  title: 'Data Literacy',
  summary: 'Read charts and tables, work with percentages and averages, and judge whether evidence supports a claim.',
  minutes: 14,
  riasecAffinity: ['I', 'C'],

  levels: [
    {
      id: 'emerging',
      label: 'Emerging',
      canDo: 'You can read simple numbers and labels in a table or chart. Percentages, averages and claims about cause and effect are likely to mislead you at this stage.',
    },
    {
      id: 'foundational',
      label: 'Foundational',
      canDo: 'You can read straightforward charts and tables and do routine percentage and average calculations. Misleading scales, extreme values and claims of cause and effect can still catch you out.',
    },
    {
      id: 'proficient',
      label: 'Proficient',
      canDo: 'You read charts and tables reliably, work out percentage change, choose a suitable average, and spot weak evidence in everyday workplace data.',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      canDo: 'You handle subtle cases: relative against absolute change, base rates, skewed data, and the limits of what a study can show. You can explain these points to colleagues.',
    },
  ],

  subskills: [
    {
      id: 'reading-charts',
      label: 'Reading charts & tables',
      selfRatePrompt: 'How confident are you at reading charts and tables correctly?',
      nextSteps: {
        develop: 'Practise one chart a day: before reading the title, find the axis labels, the units and where the scale starts. Then say in one sentence what the chart shows.',
        solid: 'Test charts against the numbers. For each chart you meet at work, check whether the axis starts at zero and whether a table of the same data would tell a different story.',
        strength: 'Teach it. Pick a misleading chart from the news or your workplace and write two sentences explaining what is misleading and how you would redraw it.',
      },
    },
    {
      id: 'proportions',
      label: 'Proportions & percentages',
      selfRatePrompt: 'How confident are you at working with percentages, ratios and rates?',
      nextSteps: {
        develop: 'Rebuild the basics: percentage of a number, percentage change, and a part as a share of a whole. Do five short problems a day until the steps feel automatic.',
        solid: 'Focus on the traps: percentage points against percent change, and successive changes. Rewrite three percentage statements from the news in plain numbers.',
        strength: 'Work on base rates and relative against absolute risk. When you see a claim like "risk doubled", ask what the starting risk was.',
      },
    },
    {
      id: 'averages-variation',
      label: 'Averages & variation',
      selfRatePrompt: 'How confident are you at choosing and interpreting averages and spread?',
      nextSteps: {
        develop: 'Learn the three averages (mean, median, mode) and when each is the right one. Calculate all three for a small set of numbers, then add one very large value and see what changes.',
        solid: 'Add spread to every average you quote. For your next report, state the range or typical variation next to the mean or median.',
        strength: 'Look at distributions, not just summaries. Plot a skewed dataset from your own work and explain why the mean and median differ.',
      },
    },
    {
      id: 'evidence-causation',
      label: 'Evidence & causation',
      selfRatePrompt: 'How confident are you at judging whether evidence supports a claim?',
      nextSteps: {
        develop: 'For each claim you read this week, ask three questions: who was measured, how were they chosen, and could something else explain the link?',
        solid: 'Learn the standard study designs and what each can and cannot show. Practise naming the most likely confounding factor in every correlation you see.',
        strength: 'Move to multiple comparisons, effect sizes and replication. Before acting on a "significant" result, ask how many things were tested and how big the effect is.',
      },
    },
  ],

  items: [
    // ---------------------------------------------------------------- reading-charts
    {
      id: 'dl-rc-1', subskill: 'reading-charts', tier: 'F',
      prompt: 'Which day sold exactly 20 more cups than Wednesday?',
      stimulus: {
        type: 'bar', title: 'Cups of coffee sold per day', yLabel: 'Cups sold', yMin: 0,
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{ name: 'Cups sold', values: [40, 55, 35, 60, 85] }],
      },
      options: [
        { id: 'a', text: 'Monday' },
        { id: 'b', text: 'Tuesday' },
        { id: 'c', text: 'Thursday' },
        { id: 'd', text: 'Friday' },
      ],
    },
    {
      id: 'dl-rc-2', subskill: 'reading-charts', tier: 'F',
      prompt: 'Which category cost less than in the month before, in both February and March?',
      stimulus: {
        type: 'table', caption: 'Monthly household costs (USD)',
        columns: ['Category', 'January', 'February', 'March'],
        rows: [
          ['Rent', '800', '800', '800'],
          ['Food', '300', '340', '310'],
          ['Transport', '90', '60', '120'],
          ['Utilities', '110', '95', '85'],
        ],
      },
      options: [
        { id: 'a', text: 'Rent' },
        { id: 'b', text: 'Food' },
        { id: 'c', text: 'Transport' },
        { id: 'd', text: 'Utilities' },
      ],
    },
    {
      id: 'dl-rc-3', subskill: 'reading-charts', tier: 'W',
      prompt: 'On this chart the bar for Company B looks about three times as tall as the bar for Company A. What does the data actually show?',
      stimulus: {
        type: 'bar', title: 'Customer satisfaction score (out of 100)', yLabel: 'Score', yMin: 80, yMax: 88,
        categories: ['Company A', 'Company B'],
        series: [{ name: 'Score', values: [82, 86] }],
      },
      options: [
        { id: 'a', text: 'B scores 4 points higher, about 5%. The axis starts at 80, which exaggerates the gap.' },
        { id: 'b', text: 'B scores about three times as high as A, as the bar heights show.' },
        { id: 'c', text: 'Nothing can be learned from the chart, because bar charts are invalid unless the axis starts at zero.' },
        { id: 'd', text: 'B scores 6 points higher, because its bar top is at 86 and the axis starts at 80.' },
      ],
    },
    {
      id: 'dl-rc-4', subskill: 'reading-charts', tier: 'W',
      prompt: 'A manager says: "Visits are rising fast, so we will reach 40 thousand a week by week 12." What is the best response?',
      stimulus: {
        type: 'line', title: 'Website visits per week (thousands)', yLabel: 'Visits (thousands)', yMin: 0,
        categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        series: [{ name: 'Visits', values: [20, 22, 21, 24, 23, 26, 25, 28] }],
      },
      options: [
        { id: 'a', text: 'Agree, because the line goes up every week, so it will keep rising at the same pace.' },
        { id: 'b', text: 'Agree, because week 8 is the highest value, so 40 thousand by week 12 is nearly certain.' },
        { id: 'c', text: 'The trend is up by about 1 thousand a week, with small dips. At that pace week 12 is nearer 32 than 40.' },
        { id: 'd', text: 'Disagree, because the dips in weeks 3, 5 and 7 show that visits are really falling.' },
      ],
    },
    {
      id: 'dl-rc-5', subskill: 'reading-charts', tier: 'A',
      prompt: 'Which statement is supported by this table?',
      stimulus: {
        type: 'table', caption: 'Sales by region (units)',
        columns: ['Region', '2023', '2024'],
        rows: [
          ['North', '200', '210'],
          ['South', '300', '330'],
          ['East', '100', '90'],
          ['West', '400', '370'],
        ],
      },
      options: [
        { id: 'a', text: 'West declined the most in percentage terms.' },
        { id: 'b', text: 'East fell by the largest percentage (10%), while West fell by the most units (30).' },
        { id: 'c', text: 'Total sales fell, because two of the four regions declined.' },
        { id: 'd', text: "South's share of total sales stayed at 30%." },
      ],
    },

    // ---------------------------------------------------------------- proportions
    {
      id: 'dl-pr-1', subskill: 'proportions', tier: 'F',
      prompt: 'A shirt costs 40 dollars. The shop reduces the price by 25%. What is the new price?',
      options: [
        { id: 'a', text: '15 dollars' },
        { id: 'b', text: '10 dollars' },
        { id: 'c', text: '30 dollars' },
        { id: 'd', text: '50 dollars' },
      ],
    },
    {
      id: 'dl-pr-2', subskill: 'proportions', tier: 'F',
      prompt: 'In a class of 24 students, 6 walk to school. What percentage of the class walks to school?',
      options: [
        { id: 'a', text: '25%' },
        { id: 'b', text: '4%' },
        { id: 'c', text: '6%' },
        { id: 'd', text: '75%' },
      ],
    },
    {
      id: 'dl-pr-3', subskill: 'proportions', tier: 'W',
      prompt: 'The unemployment rate rose from 5% to 7%. Which statement is correct?',
      options: [
        { id: 'a', text: 'It rose by 2%.' },
        { id: 'b', text: 'It rose by 40 percentage points.' },
        { id: 'c', text: 'It rose about 29%, because the 2-point rise is 29% of the new rate of 7%.' },
        { id: 'd', text: 'It rose by 2 percentage points, which is a 40% increase.' },
      ],
    },
    {
      id: 'dl-pr-4', subskill: 'proportions', tier: 'W',
      prompt: 'A price rises by 20% in January and then falls by 20% in February. Compared with the price at the start of January, the price is now:',
      options: [
        { id: 'a', text: 'unchanged.' },
        { id: 'b', text: '4% lower.' },
        { id: 'c', text: '4% higher.' },
        { id: 'd', text: '20% lower.' },
      ],
    },
    {
      id: 'dl-pr-5', subskill: 'proportions', tier: 'A',
      prompt: 'A test for a condition correctly flags 90% of people who have it, and wrongly flags 9% of people who do not. The condition affects 1 person in 100. A randomly chosen person tests positive. About how likely is it that they have the condition?',
      options: [
        { id: 'a', text: 'About 90%.' },
        { id: 'b', text: 'About 81%.' },
        { id: 'c', text: 'About 9%.' },
        { id: 'd', text: 'About 1%.' },
      ],
    },

    // ---------------------------------------------------------------- averages-variation
    {
      id: 'dl-av-1', subskill: 'averages-variation', tier: 'F',
      prompt: 'Five employees earn 30, 32, 35, 38 and 250 (thousand dollars a year). Which measure best describes a typical salary?',
      options: [
        { id: 'a', text: 'The median (35), because the very high 250 does not distort it.' },
        { id: 'b', text: 'The mean (77), because it uses every value in the group.' },
        { id: 'c', text: 'The highest value (250), because it shows what the firm can pay.' },
        { id: 'd', text: 'The range (220), because it covers the whole company.' },
      ],
    },
    {
      id: 'dl-av-2', subskill: 'averages-variation', tier: 'F',
      prompt: 'What is the median of these scores? 9, 2, 7, 3, 9, 5, 8',
      options: [
        { id: 'a', text: '3, the middle number as listed' },
        { id: 'b', text: '9, the most common number' },
        { id: 'c', text: '7' },
        { id: 'd', text: '6.1, the mean' },
      ],
    },
    {
      id: 'dl-av-3', subskill: 'averages-variation', tier: 'W',
      prompt: 'Two delivery firms both average 30 minutes. Firm X always delivers between 28 and 32 minutes. Firm Y delivers anywhere between 10 and 70 minutes. Which statement is right?',
      options: [
        { id: 'a', text: 'They perform the same, because the averages are equal.' },
        { id: 'b', text: 'X is more predictable. Y varies much more from one delivery to the next.' },
        { id: 'c', text: 'Y is better, because it sometimes delivers in only 10 minutes, which beats X.' },
        { id: 'd', text: 'Y is more reliable, because its range of times is bigger.' },
      ],
    },
    {
      id: 'dl-av-4', subskill: 'averages-variation', tier: 'W',
      prompt: 'Poll 1 asks 20 people, chosen at random, and finds 60% support a policy. Poll 2 asks 2,000 people, chosen at random, and finds 55% support it. Which is the more trustworthy estimate of public support, and why?',
      options: [
        { id: 'a', text: 'Poll 1, because 60% is higher, which shows stronger support.' },
        { id: 'b', text: 'They are equally trustworthy, because both polls choose people at random.' },
        { id: 'c', text: 'Poll 1, because asking fewer people gives a more focused answer.' },
        { id: 'd', text: 'Poll 2, because a larger sample gives a smaller margin of error.' },
      ],
    },
    {
      id: 'dl-av-5', subskill: 'averages-variation', tier: 'A',
      prompt: 'A hospital reports that its mean waiting time fell from 50 to 45 minutes. A reviewer notes that the median wait stayed at 30 minutes. What is the most likely explanation?',
      options: [
        { id: 'a', text: 'A few very long waits got shorter, while most patients waited about the same as before.' },
        { id: 'b', text: 'Every patient waited 5 minutes less, so the whole set of waits moved down.' },
        { id: 'c', text: 'The reviewer is wrong, because the mean and the median must always move together.' },
        { id: 'd', text: 'Most patients now wait longer, but a few wait much less.' },
      ],
    },

    // ---------------------------------------------------------------- evidence-causation
    {
      id: 'dl-ec-1', subskill: 'evidence-causation', tier: 'F',
      prompt: 'Ice cream sales and sunburn cases both rise every summer. What is the best conclusion?',
      options: [
        { id: 'a', text: 'Eating ice cream causes sunburn.' },
        { id: 'b', text: 'Sunburn makes people buy ice cream.' },
        { id: 'c', text: 'The pattern shows the two are unrelated.' },
        { id: 'd', text: 'Both are probably driven by a third factor: hot, sunny weather.' },
      ],
    },
    {
      id: 'dl-ec-2', subskill: 'evidence-causation', tier: 'F',
      prompt: 'A firm sends a satisfaction survey only to customers who visited its feedback page. 92% say they are satisfied. What is the main weakness of this result?',
      options: [
        { id: 'a', text: 'A figure as high as 92% is too good to be believable, so the survey must be faked.' },
        { id: 'b', text: 'Only customers who chose to respond are counted, so they may not be typical.' },
        { id: 'c', text: 'Surveys can never be used to measure how satisfied customers are.' },
        { id: 'd', text: 'The survey should have asked fewer questions to improve the response rate.' },
      ],
    },
    {
      id: 'dl-ec-3', subskill: 'evidence-causation', tier: 'W',
      prompt: 'A study finds that people who drink coffee every day live longer, on average, than people who never drink it. Which finding would most weaken the conclusion that coffee helps people live longer?',
      options: [
        { id: 'a', text: 'Coffee drinkers in the study drank three cups a day on average.' },
        { id: 'b', text: 'The study followed more than 10,000 people for 15 years.' },
        { id: 'c', text: 'Many of the non-drinkers were already seriously ill and had been told by doctors to avoid coffee.' },
        { id: 'd', text: 'Coffee contains antioxidants that protect cells from damage.' },
      ],
    },
    {
      id: 'dl-ec-4', subskill: 'evidence-causation', tier: 'W',
      prompt: 'A school wants to know whether a new reading app improves reading scores. Which design gives the strongest evidence?',
      options: [
        { id: 'a', text: 'Randomly assign students to use the app or not, then compare the gains in both groups.' },
        { id: 'b', text: 'Let students choose whether to use the app, then compare their scores with those who chose not to.' },
        { id: 'c', text: "Compare this year's scores with last year's scores, after the app was introduced." },
        { id: 'd', text: 'Ask the students who used the app whether they enjoyed it.' },
      ],
    },
    {
      id: 'dl-ec-5', subskill: 'evidence-causation', tier: 'A',
      prompt: 'A company tests 20 different button colours against its current design. One colour shows a "statistically significant" improvement at the 5% level. The other 19 show nothing. What is the sensible conclusion?',
      options: [
        { id: 'a', text: 'The colour clearly works, because the result is statistically significant.' },
        { id: 'b', text: 'The experiment is invalid, because 19 of the 20 colours showed no effect.' },
        { id: 'c', text: 'The colour works for certain, because a 5% significance level is a strict standard.' },
        { id: 'd', text: 'This is weak evidence: about one false positive is expected in 20 tests, so test that colour again first.' },
      ],
    },
  ],
}
