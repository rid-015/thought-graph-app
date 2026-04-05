import { create } from 'zustand'

// Seeded random for consistent SSR/client hydration
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Warm, techy node colors
export const NODE_COLORS = {
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  emerald: '#10b981',
  slate: '#64748b',
} as const

export type NodeColor = keyof typeof NODE_COLORS

export interface Folder {
  id: string
  name: string
  icon: string
  color: NodeColor
  isExpanded: boolean
}

export interface Thought {
  id: string
  folderId: string
  title: string
  content: string
  color: NodeColor
  createdAt: Date
  updatedAt: Date
  tags: string[]
  starred: boolean
}

export interface Connection {
  id: string
  source: string
  target: string
  type: 'relates' | 'supports' | 'contradicts' | 'evolves'
}

export interface Commit {
  id: string
  thoughtId: string | null
  message: string
  timestamp: Date
  type: 'create' | 'update' | 'connect' | 'insight'
}

export interface ActivityDay {
  date: Date
  count: number
}

type ViewMode = 'graph' | 'editor'

interface Store {
  folders: Folder[]
  thoughts: Thought[]
  connections: Connection[]
  commits: Commit[]
  activity: ActivityDay[]
  selectedThoughtId: string | null
  hoveredThoughtId: string | null
  selectedFolderId: string | null
  viewMode: ViewMode
  isCreating: boolean
  
  selectThought: (id: string | null) => void
  hoverThought: (id: string | null) => void
  selectFolder: (id: string | null) => void
  toggleFolder: (id: string) => void
  setViewMode: (mode: ViewMode) => void
  setIsCreating: (creating: boolean) => void
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  addConnection: (source: string, target: string, type: Connection['type']) => void
  addCommit: (message: string, thoughtId?: string | null, type?: Commit['type']) => void
  toggleStar: (id: string) => void
}

function generateSampleData() {
  const random = createSeededRandom(42)
  
  const folders: Folder[] = [
    { id: 'folder-ml', name: 'Machine Learning', icon: 'brain', color: 'orange', isExpanded: true },
    { id: 'folder-philosophy', name: 'Philosophy', icon: 'scroll', color: 'violet', isExpanded: false },
    { id: 'folder-design', name: 'Design Systems', icon: 'palette', color: 'rose', isExpanded: false },
    { id: 'folder-productivity', name: 'Productivity', icon: 'zap', color: 'amber', isExpanded: false },
    { id: 'folder-writing', name: 'Writing', icon: 'pen', color: 'blue', isExpanded: false },
    { id: 'folder-music', name: 'Music Theory', icon: 'music', color: 'emerald', isExpanded: false },
    { id: 'folder-misc', name: 'Miscellaneous', icon: 'box', color: 'slate', isExpanded: false },
  ]
  
const thoughtContents: Record<string, string> = {
    'Neural network intuitions': `# Neural Network Intuitions

The fundamental insight behind neural networks is that complex patterns can emerge from simple computational units working together.

## Core Concepts

**Neurons as decision makers**: Each neuron takes weighted inputs, applies an activation function, and outputs a signal. Think of it as a tiny voter that says "yes" or "no" based on evidence.

**Layers build abstraction**: Early layers detect simple patterns (edges, colors). Deeper layers combine these into complex features (faces, objects, concepts).

**Learning is optimization**: Training a network means finding the right weights to minimize error. It's like tuning a million knobs simultaneously.

## Key Intuitions

1. **Universal approximation**: Given enough neurons, a network can approximate any continuous function
2. **Representation learning**: The network discovers its own features rather than using hand-crafted ones
3. **Distributed representations**: Information is spread across many neurons, making the system robust

## Questions to Explore

- Why do deeper networks often outperform wider ones?
- How does the brain's architecture differ from artificial networks?
- What makes certain architectures better for specific tasks?`,

    'Transformer architecture': `# Transformer Architecture

The transformer revolutionized NLP by replacing recurrence with self-attention, enabling massive parallelization and better long-range dependencies.

## Architecture Overview

**Encoder-Decoder structure**: The original transformer has both, but many models use just one (BERT = encoder, GPT = decoder).

**Self-attention mechanism**: Each token attends to all other tokens, computing relevance scores. This creates a weighted combination of all positions.

**Positional encoding**: Since transformers have no inherent notion of sequence order, we inject position information through sinusoidal functions or learned embeddings.

## Why Transformers Work

1. **Parallel processing**: Unlike RNNs, all positions are processed simultaneously
2. **Direct connections**: Any two positions can interact in a single layer
3. **Scalability**: Performance improves predictably with more data and compute

## Implementation Notes

- Multi-head attention allows the model to attend to different representation subspaces
- Layer normalization is crucial for training stability
- The feedforward network after attention adds non-linearity and capacity`,

    'Attention mechanisms': `# Attention Mechanisms

Attention allows models to focus on relevant parts of the input when producing each part of the output. It's fundamentally about learning what to look at.

## The Attention Formula

**Query, Key, Value**: The core abstraction. Queries ask questions, keys advertise content, values provide the actual information.

\`\`\`
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
\`\`\`

The softmax creates a probability distribution over positions.

## Types of Attention

1. **Self-attention**: A sequence attends to itself (transformers)
2. **Cross-attention**: One sequence attends to another (translation)
3. **Multi-head attention**: Multiple attention patterns in parallel
4. **Sparse attention**: Only attend to subset of positions (efficiency)

## Intuitive Understanding

Think of attention as a soft dictionary lookup. The query is what you're looking for, keys are labels on items, and values are the items themselves. The softmax decides how much to retrieve from each item.`,

    'Gradient descent visualization': `# Gradient Descent Visualization

Understanding gradient descent geometrically transforms it from abstract math to intuitive optimization.

## The Landscape Metaphor

Imagine the loss function as a mountainous terrain. Your position is determined by the model's parameters. Gradient descent is like rolling a ball downhill—it naturally seeks lower elevation (lower loss).

## Key Visualizations

**2D contour plots**: Show loss as elevation lines. Gradient vectors point perpendicular to contours, toward steeper descent.

**3D surface plots**: Reveal valleys, ridges, and saddle points. Help understand why optimization can get stuck.

**Learning rate effects**: 
- Too small: slow progress, may get stuck
- Too large: overshooting, divergence
- Just right: efficient convergence

## Advanced Concepts

- **Momentum**: Add inertia to roll past local minima
- **Adaptive rates**: Adam, RMSprop adjust per-parameter
- **Loss landscape smoothness**: Affects trainability

## Experiments to Try

1. Visualize gradient flow through a simple network
2. Compare SGD, momentum, and Adam trajectories
3. Observe how batch size affects the landscape`,

    'Consciousness theories': `# Consciousness Theories

Exploring the hard problem: why is there subjective experience at all? Why doesn't the brain just process information "in the dark"?

## Major Theories

**Integrated Information Theory (IIT)**: Consciousness is identical to integrated information (Phi). A system is conscious to the degree it is both differentiated and integrated.

**Global Workspace Theory**: Consciousness arises when information becomes globally available to multiple brain systems. The "spotlight" of attention.

**Higher-Order Theories**: We're conscious of mental states when we have higher-order representations of them. Consciousness requires meta-cognition.

**Predictive Processing**: Consciousness emerges from the brain's attempts to minimize prediction error about its own states.

## The Hard Problem

David Chalmers distinguishes:
- **Easy problems**: Explaining cognitive functions (attention, memory, etc.)
- **Hard problem**: Explaining why there is subjective experience

No amount of functional explanation seems to bridge the "explanatory gap."

## Open Questions

- Could a sufficiently complex AI be conscious?
- Is consciousness fundamental or emergent?
- What's the relationship between consciousness and time?`,

    'Color theory fundamentals': `# Color Theory Fundamentals

Color is both physics (wavelengths of light) and psychology (perception and emotion). Great design requires understanding both.

## The Basics

**Primary systems**:
- RGB (additive): Light-based, for screens
- CMYK (subtractive): Ink-based, for print
- RYB (traditional): Artistic mixing

**Color properties**:
- Hue: The color family (red, blue, etc.)
- Saturation: Intensity/purity of the color
- Value/Lightness: How light or dark

## Color Relationships

**Complementary**: Opposite on the wheel, maximum contrast
**Analogous**: Adjacent colors, harmonious and natural
**Triadic**: Three equidistant colors, vibrant but balanced
**Split-complementary**: One color plus neighbors of its complement

## Psychological Effects

- **Warm colors** (red, orange, yellow): Energy, urgency, appetite
- **Cool colors** (blue, green, purple): Calm, trust, creativity
- **Neutrals**: Sophistication, balance, flexibility

## Practical Application

1. Start with 60-30-10 rule (dominant, secondary, accent)
2. Ensure sufficient contrast for accessibility
3. Consider color blindness (8% of men)
4. Test in context, not isolation`,

    'Deep work strategies': `# Deep Work Strategies

Cal Newport's concept: professional activities performed in a state of distraction-free concentration that push cognitive capabilities to their limit.

## The Deep Work Hypothesis

The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.

## Implementation Strategies

**Monastic**: Eliminate all shallow obligations. Rare but powerful.
**Bimodal**: Dedicate set periods (days/weeks) to deep work.
**Rhythmic**: Build daily habits, same time each day.
**Journalistic**: Fit deep work wherever you can. Requires practice.

## Practical Tactics

1. **Time blocking**: Schedule deep work sessions in advance
2. **Shutdown ritual**: Clear ending to work day enables recovery
3. **Productive meditation**: Think deeply during physical activity
4. **Tool selection**: Be intentional about technology

## Environment Design

- Dedicated deep work location
- Internet blocking tools
- Visible "do not disturb" signals
- All materials prepared in advance

## Measuring Progress

Track hours of deep work per week. Newport suggests 4 hours is realistic maximum for most people. Quality matters more than quantity.`,

    'Chord progressions': `# Chord Progressions

The harmonic movement that gives music its sense of journey and arrival. Understanding progressions unlocks composition.

## Functional Harmony

**Tonic (I)**: Home, stability, resolution
**Subdominant (IV)**: Movement away, preparation  
**Dominant (V)**: Tension, desire to resolve to tonic

Most Western music is built on this tension-resolution cycle.

## Common Progressions

**I-IV-V-I**: The foundation (countless songs)
**I-V-vi-IV**: The "pop progression" (Let It Be, No Woman No Cry)
**ii-V-I**: Jazz foundation, smooth voice leading
**I-vi-IV-V**: 50s progression (Stand By Me)
**vi-IV-I-V**: Emotional pop (Someone Like You)

## Voice Leading Principles

1. Move each voice minimally
2. Avoid parallel fifths and octaves
3. Resolve tendency tones (7→1, 4→3)
4. Keep common tones when possible

## Extending Harmony

- Add 7ths for color and sophistication
- Use secondary dominants for temporary key changes
- Explore modal interchange (borrowing from parallel modes)
- Try chromatic mediants for surprise`,

    'Typography scales': `# Typography Scales

A systematic approach to sizing type that creates visual rhythm and hierarchy throughout a design.

## The Mathematical Basis

**Modular scales**: Based on ratios like:
- Minor second: 1.067
- Major second: 1.125
- Minor third: 1.2
- Major third: 1.25
- Perfect fourth: 1.333
- Perfect fifth: 1.5
- Golden ratio: 1.618

Each size is the previous multiplied by the ratio.

## Practical Implementation

\`\`\`
Base: 16px
Scale: 1.25 (major third)

12.8px  (16 / 1.25)
16px    (base)
20px    (16 × 1.25)
25px    (20 × 1.25)
31.25px (25 × 1.25)
39px    (31.25 × 1.25)
\`\`\`

## Usage Guidelines

1. Limit to 6-8 sizes maximum
2. Reserve largest sizes for key headings
3. Body text: 16-20px for screens
4. Maintain consistent scale across breakpoints
5. Consider line-height ratios too

## Tools

- type-scale.com for generating scales
- Fluid typography with clamp() for responsive sizing
- Design systems should codify scales as tokens`,

    'Show dont tell': `# Show, Don't Tell

The foundational principle of vivid writing: render experience rather than report it. Let readers draw their own conclusions from concrete details.

## The Difference

**Telling**: "She was nervous."
**Showing**: "She twisted her ring, glancing at the door every few seconds."

**Telling**: "The house was old and creepy."
**Showing**: "Paint curled from the shutters. The porch steps groaned under his weight. Something skittered in the walls."

## When to Show

- Emotional moments that deserve weight
- Character traits you want readers to discover
- Atmosphere and setting that matters to the story
- Crucial plot points and revelations

## When Telling is Better

- Transitions and passages of time
- Unimportant information that would slow pacing
- Setup for more important showing
- Sometimes direct statements have impact

## Techniques for Showing

1. **Concrete sensory details**: What can be seen, heard, touched
2. **Character actions**: Behavior reveals psychology
3. **Dialogue**: How people speak shows who they are
4. **Specific nouns and active verbs**: "Oak" not "tree", "sprinted" not "moved quickly"

## Practice Exercise

Take a paragraph of telling and rewrite it as a scene. Add a character. Add conflict. Make it specific.`
  }
  
  const thoughtData: Record<string, { titles: string[], color: NodeColor }> = {
    'folder-ml': {
      color: 'orange',
      titles: [
        'Neural network intuitions', 'Transformer architecture', 'Attention mechanisms',
        'Gradient descent visualization', 'Loss functions', 'Backpropagation',
        'Embeddings and vector spaces', 'Feature engineering', 'Model compression',
        'Transfer learning patterns', 'Few-shot learning', 'Reinforcement learning basics',
        'GANs and generative models', 'Diffusion models', 'LLM prompting strategies',
      ]
    },
    'folder-philosophy': {
      color: 'violet',
      titles: [
        'Consciousness theories', 'Free will paradox', 'Ethics of AI',
        'Epistemology notes', 'Phenomenology intro', 'Mind-body problem',
        'Determinism vs chaos', 'Emergence patterns', 'Systems thinking',
        'Complexity and simplicity', 'Reductionism limits', 'Holistic approaches',
      ]
    },
    'folder-design': {
      color: 'rose',
      titles: [
        'Color theory fundamentals', 'Typography scales', 'Spacing systems',
        'Component architecture', 'Design tokens', 'Accessibility patterns',
        'Motion design principles', 'Dark mode strategies', 'Responsive patterns',
        'Icon design rules', 'Grid systems', 'Visual hierarchy',
      ]
    },
    'folder-productivity': {
      color: 'amber',
      titles: [
        'Deep work strategies', 'Time blocking', 'Energy management',
        'Note-taking systems', 'Spaced repetition', 'Second brain concepts',
        'GTD methodology', 'Pomodoro variations', 'Focus environments',
      ]
    },
    'folder-writing': {
      color: 'blue',
      titles: [
        'Show dont tell', 'Voice and tone', 'Narrative structures',
        'Editing techniques', 'Research methods', 'Outline strategies',
        'Writing rituals', 'Feedback loops', 'Publishing workflows',
      ]
    },
    'folder-music': {
      color: 'emerald',
      titles: [
        'Chord progressions', 'Modal interchange', 'Voice leading',
        'Rhythm patterns', 'Harmonic analysis', 'Melodic contour',
        'Song structure', 'Production techniques',
      ]
    },
    'folder-misc': {
      color: 'slate',
      titles: [
        'Coffee brewing methods', 'Book recommendations', 'Travel notes',
        'Recipe ideas', 'Fitness tracking', 'Language learning',
        'Meditation practice', 'Sleep optimization',
      ]
    }
  }
  
  const thoughts: Thought[] = []
  const connections: Connection[] = []
  const commits: Commit[] = []
  
  let thoughtIndex = 0
  const thoughtsByFolder: Record<string, string[]> = {}
  const baseDate = new Date('2026-04-01T12:00:00Z').getTime()
  
  // Create thoughts
  Object.entries(thoughtData).forEach(([folderId, data]) => {
    thoughtsByFolder[folderId] = []
    
    data.titles.forEach((title) => {
      const id = `thought-${thoughtIndex++}`
      thoughtsByFolder[folderId].push(id)
      
      // Use folder color with occasional variation
      const useMainColor = random() > 0.2
      const colorKeys = Object.keys(NODE_COLORS) as NodeColor[]
      const color = useMainColor ? data.color : colorKeys[Math.floor(random() * colorKeys.length)]
      
      const createdOffset = Math.floor(random() * 60) * 24 * 60 * 60 * 1000
      const updatedOffset = Math.floor(random() * 14) * 24 * 60 * 60 * 1000
      
      const richContent = thoughtContents[title] || `# ${title}\n\nExploring ${title.toLowerCase()}. This thought connects various concepts and ideas worth developing further.\n\n## Key Ideas\n\n- First insight about this topic\n- Connection to related concepts\n- Questions to explore further\n\n## Notes\n\nAdd your detailed notes here...`
      
      thoughts.push({
        id,
        folderId,
        title,
        content: richContent,
        color,
        createdAt: new Date(baseDate - createdOffset),
        updatedAt: new Date(baseDate - updatedOffset),
        tags: [folderId.replace('folder-', '')],
        starred: random() > 0.88,
      })
    })
  })
  
  // Create connections
  const folderIds = Object.keys(thoughtsByFolder)
  
  folderIds.forEach(folderId => {
    const folderThoughts = thoughtsByFolder[folderId]
    
    // Intra-folder connections
    folderThoughts.forEach((thoughtId, idx) => {
      const numConnections = 2 + Math.floor(random() * 3)
      const targets = new Set<string>()
      
      for (let i = 0; i < numConnections; i++) {
        const targetIdx = Math.floor(random() * folderThoughts.length)
        if (targetIdx !== idx) targets.add(folderThoughts[targetIdx])
      }
      
      targets.forEach(target => {
        connections.push({
          id: `conn-${connections.length}`,
          source: thoughtId,
          target,
          type: random() > 0.7 ? 'supports' : 'relates',
        })
      })
    })
    
    // Cross-folder connections
    const otherFolders = folderIds.filter(f => f !== folderId)
    const numCross = Math.floor(folderThoughts.length * 0.25)
    
    for (let i = 0; i < numCross; i++) {
      const sourceIdx = Math.floor(random() * folderThoughts.length)
      const targetFolder = otherFolders[Math.floor(random() * otherFolders.length)]
      const targetThoughts = thoughtsByFolder[targetFolder]
      const targetIdx = Math.floor(random() * targetThoughts.length)
      
      connections.push({
        id: `conn-${connections.length}`,
        source: folderThoughts[sourceIdx],
        target: targetThoughts[targetIdx],
        type: random() > 0.5 ? 'relates' : 'evolves',
      })
    }
  })
  
  // Create commits
  const commitMessages = [
    'Initial exploration of transformer architectures',
    'Connected attention mechanisms to consciousness theories',
    'Refined color theory fundamentals',
    'Added cross-reference to productivity systems',
    'Expanded notes on modal interchange',
    'Linked writing techniques to design documentation',
    'Deep dive into gradient descent',
    'Connected stoic principles to deep work',
    'Explored relationship between GANs and diffusion',
    'Updated typography scales with new insights',
    'Connected neural network intuitions to emergence patterns',
    'Added new perspective on free will',
  ]
  
  const commitBaseDate = new Date('2026-04-05T10:00:00Z').getTime()
  commitMessages.forEach((message, idx) => {
    commits.push({
      id: `commit-${idx}`,
      thoughtId: idx < 8 ? thoughts[idx % thoughts.length].id : null,
      message,
      timestamp: new Date(commitBaseDate - (commitMessages.length - idx) * 2 * 60 * 60 * 1000),
      type: idx % 4 === 0 ? 'create' : idx % 4 === 1 ? 'update' : idx % 4 === 2 ? 'connect' : 'insight',
    })
  })
  
  // Generate activity data
  const activity: ActivityDay[] = []
  const activityRandom = createSeededRandom(99)
  const today = new Date('2026-04-05')
  
  for (let week = 51; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (week * 7 + (6 - day)))
      
      let count = 0
      const chance = activityRandom()
      if (chance > 0.4) count = Math.floor(activityRandom() * 3) + 1
      if (chance > 0.75) count = Math.floor(activityRandom() * 4) + 3
      if (chance > 0.92) count = Math.floor(activityRandom() * 5) + 6
      
      if (day >= 1 && day <= 5 && activityRandom() > 0.3) {
        count = Math.min(count + 1, 10)
      }
      
      activity.push({ date, count })
    }
  }
  
  return { folders, thoughts, connections, commits, activity }
}

const sampleData = generateSampleData()

export const useStore = create<Store>((set, get) => ({
  folders: sampleData.folders,
  thoughts: sampleData.thoughts,
  connections: sampleData.connections,
  commits: sampleData.commits,
  activity: sampleData.activity,
  selectedThoughtId: null,
  hoveredThoughtId: null,
  selectedFolderId: null,
  viewMode: 'graph',
  isCreating: false,
  
  selectThought: (id) => set({ selectedThoughtId: id, viewMode: id ? 'editor' : 'graph' }),
  hoverThought: (id) => set({ hoveredThoughtId: id }),
  selectFolder: (id) => set({ selectedFolderId: id }),
  toggleFolder: (id) => set(state => ({
    folders: state.folders.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f)
  })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  
  addThought: (thought) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    set(state => ({
      thoughts: [...state.thoughts, { ...thought, id, createdAt: now, updatedAt: now }],
      activity: state.activity.map((a, i) => 
        i === state.activity.length - 1 ? { ...a, count: a.count + 1 } : a
      ),
      selectedThoughtId: id,
      viewMode: 'editor',
      isCreating: false,
    }))
    get().addCommit(`Created "${thought.title}"`, id, 'create')
    return id
  },
  
  updateThought: (id, updates) => {
    set(state => ({
      thoughts: state.thoughts.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }))
  },
  
  deleteThought: (id) => {
    const thought = get().thoughts.find(t => t.id === id)
    set(state => ({
      thoughts: state.thoughts.filter(t => t.id !== id),
      connections: state.connections.filter(c => c.source !== id && c.target !== id),
      selectedThoughtId: state.selectedThoughtId === id ? null : state.selectedThoughtId,
      viewMode: state.selectedThoughtId === id ? 'graph' : state.viewMode,
    }))
    if (thought) get().addCommit(`Deleted "${thought.title}"`, null, 'update')
  },
  
  addConnection: (source, target, type) => {
    const id = `conn-${Date.now()}`
    set(state => ({
      connections: [...state.connections, { id, source, target, type }],
    }))
    const sourceThought = get().thoughts.find(t => t.id === source)
    const targetThought = get().thoughts.find(t => t.id === target)
    if (sourceThought && targetThought) {
      get().addCommit(`Connected "${sourceThought.title}" → "${targetThought.title}"`, source, 'connect')
    }
  },
  
  addCommit: (message, thoughtId = null, type = 'insight') => {
    const id = `commit-${Date.now()}`
    set(state => ({
      commits: [{ id, thoughtId, message, timestamp: new Date(), type }, ...state.commits],
    }))
  },
  
  toggleStar: (id) => {
    set(state => ({
      thoughts: state.thoughts.map(t => t.id === id ? { ...t, starred: !t.starred } : t),
    }))
  },
}))
