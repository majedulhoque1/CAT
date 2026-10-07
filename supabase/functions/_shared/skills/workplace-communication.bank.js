// Workplace Communication — PUBLIC bank (situational judgement, "knowledge"
// instructions: choose the MOST EFFECTIVE response). Contains no answers.
// Keys live in workplace-communication.keys.js (server-only). Plain ESM, zero imports.
//
// Tiers per subskill, in order: F, F, W, W, A.
// Option ids are stable (a-d); the UI shuffles display order per run.

export default {
  slug: 'workplace-communication',
  version: 1,
  title: 'Workplace Communication',
  summary: 'Write and speak clearly, adapt to your audience, listen well, and handle difficult conversations.',
  minutes: 14,
  riasecAffinity: ['S', 'E'],

  levels: [
    {
      id: 'emerging',
      label: 'Emerging',
      canDo: 'You communicate in a basic, direct way at work. Your messages can bury the main point, miss what the audience needs, or make hard conversations harder than they need to be.',
    },
    {
      id: 'foundational',
      label: 'Foundational',
      canDo: 'You communicate clearly in routine situations and know the basics of tone and listening. Under pressure, or with senior or unfamiliar audiences, your choices become less reliable.',
    },
    {
      id: 'proficient',
      label: 'Proficient',
      canDo: 'You structure messages so the point is easy to find, adapt your tone to the audience, listen in order to understand, and raise difficult issues respectfully.',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      canDo: 'You handle subtle situations well: competing audiences, different cultural expectations, emotional conversations and senior stakeholders. You choose responses that protect both the relationship and the outcome.',
    },
  ],

  subskills: [
    {
      id: 'clarity-structure',
      label: 'Clarity & structure',
      selfRatePrompt: 'How confident are you that your messages are clear and well structured?',
      nextSteps: {
        develop: 'Before you send any message, write the one sentence the reader must remember, and put it first. Do this for every email for two weeks.',
        solid: 'Test your messages on a busy reader: can they act after reading only the first two lines? Cut anything that does not help them act.',
        strength: 'Coach others. Take a long update written by a colleague and rewrite it into status, risk and decision. Compare and discuss the differences.',
      },
    },
    {
      id: 'audience-tone',
      label: 'Audience & tone',
      selfRatePrompt: 'How confident are you at adapting your message and tone to the audience?',
      nextSteps: {
        develop: 'For each message, name the reader and ask what they already know and what they need. Replace one piece of jargon or one blunt phrase before you send.',
        solid: 'Write the same news for two different audiences and compare. Keep the facts identical and change only the detail, order and wording.',
        strength: 'Take on a message that crosses cultures or levels: for example an update to a senior leader or an overseas partner. Ask a trusted colleague how it landed.',
      },
    },
    {
      id: 'listening-questions',
      label: 'Listening & questions',
      selfRatePrompt: 'How confident are you at listening and asking questions that uncover what people mean?',
      nextSteps: {
        develop: 'In your next three conversations, wait two seconds after the other person finishes, then ask one open question before you give any opinion or advice.',
        solid: 'Summarise back what you heard before you respond: "So you are saying... is that right?" Notice how often your first guess was off.',
        strength: 'Practise listening for what is not said: the feelings, the stakes and the underlying need. Ask for feedback on how heard people feel after talking to you.',
      },
    },
    {
      id: 'difficult-conversations',
      label: 'Difficult conversations',
      selfRatePrompt: 'How confident are you at raising difficult issues and handling tense conversations?',
      nextSteps: {
        develop: 'Prepare one difficult conversation using a simple script: what I observed, the effect it had, and what I would like to change. Say it aloud before the real conversation.',
        solid: 'Work on the first 30 seconds. Rehearse an opening that is specific, calm and about the behaviour, not the person. Then practise staying curious when the reply is defensive.',
        strength: 'Handle higher-stakes cases: conflict between others, bad news to clients, and saying no to senior people. Debrief each one afterwards: what worked, what you would change.',
      },
    },
  ],

  items: [
    // ---------------------------------------------------------------- clarity-structure
    {
      id: 'wc-cs-1', subskill: 'clarity-structure', tier: 'F',
      prompt: 'Your manager asks whether the report will be ready on Friday. It will not be ready until Monday. You write a short email. Which opening line is most effective?',
      options: [
        { id: 'a', text: 'I hope you are well! I have been busy with several things this week and wanted to give you an update.' },
        { id: 'b', text: 'The report will be ready on Monday, not Friday. Below is the reason and what I need from you.' },
        { id: 'c', text: 'I am so sorry, I know this is not what you wanted to hear and I feel terrible about it.' },
        { id: 'd', text: 'As previously discussed, several factors have had an impact on the original timeline.' },
      ],
    },
    {
      id: 'wc-cs-2', subskill: 'clarity-structure', tier: 'F',
      prompt: 'You need a colleague to check some figures. Which request is clearest?',
      options: [
        { id: 'a', text: 'Can you look at this when you get a chance? It would be really helpful to have your input on it.' },
        { id: 'b', text: 'I need your help urgently with the thing we talked about earlier, as it is quite important to the team.' },
        { id: 'c', text: 'Could someone maybe check the data for me, if that is possible and if anyone has the time to do it?' },
        { id: 'd', text: 'Could you check the totals in column D of the sales sheet by 3 pm today? They look 10% too high.' },
      ],
    },
    {
      id: 'wc-cs-3', subskill: 'clarity-structure', tier: 'W',
      prompt: 'You have five minutes to update senior leaders on a project. You have 30 slides of detail. What is the most effective approach?',
      options: [
        { id: 'a', text: 'Start with the status and the one decision or risk that needs action, and offer the detail if asked.' },
        { id: 'b', text: 'Go through all 30 slides quickly, so that the leaders have seen everything and nothing is left out.' },
        { id: 'c', text: 'Begin with the history of the project so that the leaders understand the full context before the update.' },
        { id: 'd', text: 'Send the 30 slides beforehand, and use the five minutes only for questions, with no summary from you.' },
      ],
    },
    {
      id: 'wc-cs-4', subskill: 'clarity-structure', tier: 'W',
      prompt: 'Which status update is best structured for a busy reader?',
      options: [
        { id: 'a', text: 'Went well overall. A few issues. We will fix them. More details later.' },
        { id: 'b', text: 'Last week we started the migration. On Tuesday we found three issues. On Thursday we fixed two of them. Today we are working on the third.' },
        { id: 'c', text: 'Status: on track, 80% complete. Risk: a supplier delay could add 2 days. Decision needed: approve $2,000 extra budget by Wednesday.' },
        { id: 'd', text: 'Things are mostly good, although there are several items we are monitoring, including budget, supplier and timing.' },
      ],
    },
    {
      id: 'wc-cs-5', subskill: 'clarity-structure', tier: 'A',
      prompt: 'You sent a two-page email proposing a change. A busy director replies: "Too long. What do you want from me?" What is the most effective reply?',
      options: [
        { id: 'a', text: 'Sorry about that, I know your time is limited. I will make my emails much shorter in future.' },
        { id: 'b', text: 'Please approve a three-month pilot in Team B by Friday. It should save about five hours a week at no extra cost.' },
        { id: 'c', text: 'Apologies for the length. I will resend the same text with the key points in bold so that it is easier to scan.' },
        { id: 'd', text: 'I included everything so that you could make a decision with full information and no surprises later.' },
      ],
    },

    // ---------------------------------------------------------------- audience-tone
    {
      id: 'wc-at-1', subskill: 'audience-tone', tier: 'F',
      prompt: 'You must tell a new colleague, who is not technical, that the system will be unavailable on Saturday for maintenance. Which message is most effective?',
      options: [
        { id: 'a', text: 'The system will be unavailable from 8 am to noon on Saturday for an update. Please save your work first.' },
        { id: 'b', text: 'The database will undergo scheduled downtime for a patch rollout. Estimated duration: four hours.' },
        { id: 'c', text: 'System down on Saturday morning for maintenance. Please plan around it and do not try to log in.' },
        { id: 'd', text: 'We regret to inform you that the infrastructure will be temporarily non-operational at the aforementioned time.' },
      ],
    },
    {
      id: 'wc-at-2', subskill: 'audience-tone', tier: 'F',
      prompt: 'A customer sends an angry message about a late order. Which opening is most effective?',
      options: [
        { id: 'a', text: 'Please calm down. The delay was caused by the courier company and was completely out of our control.' },
        { id: 'b', text: 'As stated in our delivery policy, orders can take up to 10 working days to arrive at your address.' },
        { id: 'c', text: 'I am sorry your order is late, and I understand why that is frustrating. Here is what I can do now.' },
        { id: 'd', text: 'Thank you for your feedback. We value all comments from our customers and will pass this on.' },
      ],
    },
    {
      id: 'wc-at-3', subskill: 'audience-tone', tier: 'W',
      prompt: 'You need to explain a project delay to two audiences: the engineering team and the chief executive. What is the most effective approach?',
      options: [
        { id: 'a', text: 'Send both groups the same detailed technical explanation, so that everyone receives identical information.' },
        { id: 'b', text: 'Give the chief executive only the good news and the engineers the real details, so that each hears what they want.' },
        { id: 'c', text: 'Send both groups a one-line summary of the delay, so that nobody is confused by too much detail.' },
        { id: 'd', text: 'Tell the chief executive the impact and plan in plain words, and the engineers the cause. Keep the facts identical.' },
      ],
    },
    {
      id: 'wc-at-4', subskill: 'audience-tone', tier: 'W',
      prompt: "You disagree with a peer's written proposal and must reply in writing. Which reply is most effective?",
      options: [
        { id: 'a', text: 'I disagree with this proposal. I think the plan will not work and I do not see how it can succeed.' },
        { id: 'b', text: 'I agree with the goal. I worry about the timeline, because the vendor needs three weeks. Could we start smaller?' },
        { id: 'c', text: "You clearly have not thought about the vendor's lead time, and that makes the whole plan unrealistic." },
        { id: 'd', text: 'Great idea! Maybe we could think about it a bit more, or perhaps not. It is really up to you, though.' },
      ],
    },
    {
      id: 'wc-at-5', subskill: 'audience-tone', tier: 'A',
      prompt: 'You work with a partner team whose working style avoids saying "no" directly. Their request cannot be done by their date. What is the most effective reply?',
      options: [
        { id: 'a', text: 'No, we cannot do that by that date. It is not possible with the people and the time that we have available.' },
        { id: 'b', text: 'We will do our best to meet the date, and we will keep you informed of our progress as we go.' },
        { id: 'c', text: 'Let me check with my manager about this request, and I will come back to you as soon as I can.' },
        { id: 'd', text: 'Thanks for explaining the goal. All of it by that date would risk quality. We could deliver part A then and part B later. Would that work?' },
      ],
    },

    // ---------------------------------------------------------------- listening-questions
    {
      id: 'wc-lq-1', subskill: 'listening-questions', tier: 'F',
      prompt: 'A teammate says: "I am swamped this week." What is the most effective first response?',
      options: [
        { id: 'a', text: 'Everyone is swamped at the moment. Welcome to the club, we are all in the same position.' },
        { id: 'b', text: 'You should try using a to-do list. Let me show you the one that I use, it works well.' },
        { id: 'c', text: 'Why did you not say something about it earlier? We could have shared the work out.' },
        { id: 'd', text: 'That sounds like a lot. What is taking most of your time right now?' },
      ],
    },
    {
      id: 'wc-lq-2', subskill: 'listening-questions', tier: 'F',
      prompt: 'In a meeting, a client says: "We need this to be more flexible." Which response is most effective?',
      options: [
        { id: 'a', text: 'Can you give me an example of a time when it was not flexible enough for you?' },
        { id: 'b', text: 'So what you really want is a bigger budget, so that we can add more features, is that right?' },
        { id: 'c', text: 'Why do you always ask for changes at the last moment, when we have already agreed the plan?' },
        { id: 'd', text: 'Understood. I will make it more flexible, and I will have a new version ready for you next week.' },
      ],
    },
    {
      id: 'wc-lq-3', subskill: 'listening-questions', tier: 'W',
      prompt: 'In a one-to-one meeting, a team member gives a long, emotional account of a conflict. You are short of time. What is most effective?',
      options: [
        { id: 'a', text: 'Interrupt politely and ask them to get to the point, because you only have a few minutes left.' },
        { id: 'b', text: 'Glance at your notes and nod now and then to show that you are still following the story.' },
        { id: 'c', text: 'Let them finish, summarise what you heard, and agree a time to continue if needed.' },
        { id: 'd', text: 'Suggest a solution as soon as you can see what the problem is, so that the time is used well.' },
      ],
    },
    {
      id: 'wc-lq-4', subskill: 'listening-questions', tier: 'W',
      prompt: 'A stakeholder says: "I want a dashboard." Which question best uncovers what they need?',
      options: [
        { id: 'a', text: 'Which colours and layout would you like the dashboard to use, and how many charts should it have?' },
        { id: 'b', text: 'What decision will you make with it, and what must you see to make it?' },
        { id: 'c', text: 'Do you want it built in Excel or in Power BI, and who will be the main user of it?' },
        { id: 'd', text: 'Do you want a dashboard that updates daily, yes or no, so that we can plan the work?' },
      ],
    },
    {
      id: 'wc-lq-5', subskill: 'listening-questions', tier: 'A',
      prompt: 'In your review, your manager says: "You are sometimes hard to work with." What is the most effective response?',
      options: [
        { id: 'a', text: 'Thank you for telling me. Could you give me a recent example, so that I understand what you saw?' },
        { id: 'b', text: 'That is not fair. Who said that? I would like to know who made the comment, so that I can respond.' },
        { id: 'c', text: 'OK, I will try to be easier to work with from now on, and I will ask you for feedback later.' },
        { id: 'd', text: 'I do not think that is true. I work well with everyone, and my past reviews have been very good.' },
      ],
    },

    // ---------------------------------------------------------------- difficult-conversations
    {
      id: 'wc-dc-1', subskill: 'difficult-conversations', tier: 'F',
      prompt: 'A colleague often arrives late to team meetings. You decide to raise it. What is the most effective way to start?',
      options: [
        { id: 'a', text: 'You are so unprofessional, and everyone has noticed that you are always late to our meetings.' },
        { id: 'b', text: 'Some people have mentioned that certain people are often late, and that it is a problem for the team.' },
        { id: 'c', text: 'I noticed that you arrived 10 to 15 minutes late to the last three team meetings. Can we talk?' },
        { id: 'd', text: 'Why do you hate our meetings so much that you cannot manage to arrive on time like everyone else?' },
      ],
    },
    {
      id: 'wc-dc-2', subskill: 'difficult-conversations', tier: 'F',
      prompt: 'Your manager gives you extra work when your week is already full. What is the most effective way to respond?',
      options: [
        { id: 'a', text: 'I cannot take this on this week because of X and Y. Which should I put aside, or can it wait?' },
        { id: 'b', text: 'No. I am too busy this week, and I already have more work than I can possibly manage properly.' },
        { id: 'c', text: 'Sure, no problem. I will fit it in somehow, even if I have to work late for the next few days.' },
        { id: 'd', text: 'I will try, but I am already very busy, so it probably will not be done very well.' },
      ],
    },
    {
      id: 'wc-dc-3', subskill: 'difficult-conversations', tier: 'W',
      prompt: "A team member's reports often contain errors. Which feedback is most effective?",
      options: [
        { id: 'a', text: 'Your work is sloppy and it is causing problems for the whole team. You need to fix it.' },
        { id: 'b', text: 'In the last two reports I found four errors in the totals. Let us agree a way to check them before you send.' },
        { id: 'c', text: 'Maybe you could try to be a little more careful with your reports, if that is at all possible.' },
        { id: 'd', text: 'Good work overall, and the team is very happy with you! There is one tiny thing, but it is not important.' },
      ],
    },
    {
      id: 'wc-dc-4', subskill: 'difficult-conversations', tier: 'W',
      prompt: 'Two colleagues each come to you separately to complain about the other. You are not their manager. What is the most effective response?',
      options: [
        { id: 'a', text: 'Side with the colleague you know better, because you are more likely to understand their view of events.' },
        { id: 'b', text: 'Tell each of them that they are right, so that everyone feels better and the problem goes away quickly.' },
        { id: 'c', text: 'Stay out of it completely, because it is not your problem and getting involved could make things worse.' },
        { id: 'd', text: 'Listen to each without judging, and encourage them to talk directly. Involve their manager if it continues.' },
      ],
    },
    {
      id: 'wc-dc-5', subskill: 'difficult-conversations', tier: 'A',
      prompt: 'Your team missed a deadline and a client project failed. The client is angry on a call. What is the most effective approach?',
      options: [
        { id: 'a', text: "Explain the full timeline of events in detail, to show the client that the failure was not one person's fault alone." },
        { id: 'b', text: "Say that a supplier's delay caused the problem, since this is partly true and it will help to keep the client calm." },
        { id: 'c', text: 'Acknowledge the miss and its impact, say how and by when you will fix it, and ask what matters most to them.' },
        { id: 'd', text: 'Offer a full refund immediately to calm things down, because the client is angry and wants to see action now.' },
      ],
    },
  ],
}
