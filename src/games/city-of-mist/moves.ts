/** Original paraphrases checked against the supplied 2019 Player Moves sheet.
 * These references do not roll dice or apply narrative outcomes to character data.
 */
export const cityMoves = [
  {
    id: 'investigate',
    name: 'Investigate',
    page: 1,
    summary:
      'Seek answers using a relevant method. A hit grants Clues equal to Power; each spent Clue gets an answer or useful lead.',
    options: [
      'Spend a Clue after receiving information',
      '7–9: the investigation creates danger (MC choice)',
      '7–9: information is incomplete or unreliable (MC choice)',
      '7–9: the source asks a question in return (MC choice)',
    ],
  },
  {
    id: 'hit-with-all-you-have-got',
    name: 'Hit With All You’ve Got',
    page: 1,
    summary:
      'Attack with a clear opportunity. On a hit, impose a suitable status at Power tier. Choose one benefit on 7–9 or two on 10+.',
    options: [
      'Protect yourself against retaliation',
      'Increase the impact or number of targets (+1 tier)',
      'Control incidental damage',
      'Keep the target focused on you',
      'Gain one Juice',
    ],
  },
  {
    id: 'go-toe-to-toe',
    name: 'Go Toe to Toe',
    page: 1,
    summary:
      'State your goal in a contested struggle. Choose one benefit on 7–9 or two on 10+.',
    options: [
      'Achieve the stated goal',
      'Give the opponent a status at Power tier',
      'Prevent the opponent’s retaliation',
    ],
  },
  {
    id: 'face-danger',
    name: 'Face Danger',
    page: 1,
    summary:
      'Use an appropriate ability against a named incoming status. On 10+, avoid it; on 7–9, reduce it by one tier; on a miss, take it at full tier.',
    options: [
      'Avoid the status (10+)',
      'Take the status at one lower tier (7–9)',
      'Take the full status (miss)',
    ],
  },
  {
    id: 'change-the-game',
    name: 'Change the Game',
    page: 1,
    summary:
      'Create an advantage. A hit grants Juice equal to Power, with at least two on 10+. Effects must fit the generating method. Each chosen effect costs Juice.',
    options: [
      'Create a story tag',
      'Burn an eligible tag',
      'Give a status (one Juice per tier)',
      'Reduce a status (one Juice per tier)',
      '10+: expand scope or targets',
      '10+: extend duration',
      '10+: conceal the effect',
      '10+: another MC-approved improvement',
    ],
  },
  {
    id: 'convince',
    name: 'Convince',
    page: 1,
    summary:
      'Persuade, threaten, or entice a target. On a hit, propose a fitting status at Power tier. The target may accept it or concede; 7–9 leaves their agenda protected, while 10+ incorporates yours temporarily.',
    options: [
      'Target accepts the proposed status',
      'Target partially concedes (7–9)',
      'Target adjusts their agenda (10+)',
    ],
  },
  {
    id: 'take-the-risk',
    name: 'Take the Risk',
    page: 1,
    summary:
      'Attempt a dangerous feat. On 10+, accomplish it. On 7–9, the MC introduces a difficult bargain or choice.',
    options: [
      'Accomplish the feat (10+)',
      'Resolve the MC’s bargain or choice (7–9)',
    ],
  },
  {
    id: 'sneak-around',
    name: 'Sneak Around',
    page: 1,
    summary:
      'Act covertly or deceptively. A hit fools the appropriate observers. On 7–9, the MC chooses a complication.',
    options: [
      'An unexpected witness notices (MC choice)',
      'A secondary sense detects part of the action (MC choice)',
      'Leave something valuable behind or risk discovery (MC choice)',
    ],
  },
  {
    id: 'montage',
    name: 'Montage (Downtime)',
    page: 2,
    summary:
      'Choose one downtime activity and describe it. The MC may turn it into a scene. Recovery is subject to the fiction and the MC’s ruling.',
    options: [
      'Attend to a Logos/extra theme: mark Attention',
      'Investigate the case: gain three Clues with method/source',
      'Explore a Mystery: gain one Clue and mark its theme’s Attention',
      'Prepare: recover burnt power tags',
      'Prepare: gain three Juice with a method',
      'Recover: ask the MC which statuses can be reduced',
    ],
  },
  {
    id: 'credits',
    name: 'Geek Out During Credits',
    page: 2,
    summary:
      'At session end, discuss crew growth, meaningful relationships, and the theme under greatest strain. Answer one or more prompts.',
    options: [
      'Recover one burnt crew power tag',
      'Mark crew-theme Attention',
      'Add one Help or Hurt for a meaningful interaction',
      'Describe a strained theme’s potential replacement in Flipside',
    ],
  },
  {
    id: 'answers',
    name: 'Finally, Some Answers',
    page: 2,
    summary:
      'When a Mystery yields answers, choose any applicable responses; more than one is allowed.',
    options: [
      'Mark Attention for deeper understanding',
      'Mark Fade or Crack where the revelation causes rejection',
      'Replace an answered Mystery with a new question',
    ],
  },
  {
    id: 'stop-holding-back',
    name: 'Stop. Holding. Back.',
    page: 2,
    summary:
      'Propose an unprecedented use of power and agree its sacrifice with the MC before resolving +Logos. A hit achieves the proposal and pays the band’s price. A miss pays the 7–9 price and adds loss of control or failure, determined by the MC.',
    options: [
      'Significant 7–9: mark strain and burn one theme’s power tags',
      'Significant 10+: mark one theme’s strain',
      'No Return 7–9: replace one theme',
      'No Return 10+: mark strain and burn one theme’s power tags',
      'Ultimate 7–9: take tier six; no Face Danger',
      'Ultimate 10+: replace one theme',
    ],
  },
  {
    id: 'end-of-the-road',
    name: 'End of the Road',
    page: 2,
    summary:
      'When an Identity is fulfilled, restate it in a similar spirit with a new purpose, or replace its theme if that part of life has ended.',
    options: ['Rephrase the Identity', 'Replace the ended theme'],
  },
  {
    id: 'flashback',
    name: 'Flashback',
    page: 2,
    summary:
      'Once per session during your spotlight, bring the past into the current situation.',
    options: [
      'Play an earlier action with a move affecting the present',
      'Describe relevant backstory; the MC may award one Clue or Juice',
    ],
  },
  {
    id: 'hard-choice',
    name: 'Make a Hard Choice',
    page: 2,
    summary:
      'Development follows your response to a Mystery or Identity. Discuss whether the fictional trigger applies.',
    options: [
      'Pass up reachable answers: mark that Mystery’s Fade',
      'Fail to uphold an Identity: mark its Crack',
      'Sacrifice a genuine desire for an Identity: mark its Attention',
    ],
  },
] as const;
