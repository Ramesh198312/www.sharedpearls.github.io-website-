/* =========================================================================
   SENTENCE STRUCTURE — CONTENT DATA
   All linguistic content is separated from presentation logic here.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. SYNTAX TREE DATA
   Sentence: "The exceptionally talented researcher presented the findings
   to the committee."
   A constituent-based (X-bar informed) analysis. Function labels follow
   traditional/functional grammar; category labels follow phrase-structure
   grammar. Framework caveats are noted in the UI copy, not baked in here.
   ------------------------------------------------------------------------- */
const TREE_DATA = {
  id: "S",
  category: "S (Sentence / Clause)",
  name: "S — Root Clause",
  func: "Independent declarative clause",
  def: "The full clause: a Subject constituent combined with a Predicate (VP) that together express a complete proposition.",
  example: "The exceptionally talented researcher presented the findings to the committee.",
  example2: "S can itself be embedded as a dependent clause within a larger sentence (e.g. \"…that the researcher presented the findings…\").",
  relation: "S immediately dominates two daughters: the subject NP and the predicate VP. Word order (Subject before Predicate) is fixed in this declarative clause type.",
  semantic: "Denotes a full proposition: an event of presenting, with an agent, a theme, and a recipient/goal.",
  pragmatic: "As an independent declarative, this clause is used to make an assertion — the default sentence type for conveying new information as fact.",
  children: [
    {
      id: "NP-subj",
      category: "NP (Noun Phrase)",
      name: "NP — Subject",
      func: "Subject of S",
      def: "A phrase whose head is a noun, which agrees with the verb and typically appears before it in a declarative clause.",
      example: "the exceptionally talented researcher",
      example2: "compare: she (a pronominal NP performing the identical function)",
      relation: "Sister to VP under S; controls subject–verb agreement (a singular head licenses the singular predicate presented).",
      semantic: "Assigned the Agent thematic role by the verb present: the entity performing the act of presenting.",
      pragmatic: "Clause-initial position marks this NP as the sentence topic — what the sentence is about.",
      children: [
        { id: "Det1", category: "Det (Determiner)", name: "the", func: "Determiner of NP", def: "A determiner specifies definiteness/reference for the noun phrase; \"the\" marks the referent as identifiable to the listener.", example: "the", example2: "contrast: a researcher (indefinite)", relation: "Leftmost dependent of N inside NP; does not itself have a head–complement relation with N.", semantic: "Contributes definite reference: the speaker presumes the hearer can identify which researcher is meant.", pragmatic: "Signals given/identifiable information rather than introducing a brand-new discourse referent.", children: [] },
        {
          id: "AdjP1", category: "AdjP (Adjective Phrase)", name: "exceptionally talented", func: "Modifier (attributive) of N", def: "A phrase headed by an adjective that modifies the following noun, itself optionally modified by a degree adverb.", example: "exceptionally talented", example2: "compare: remarkably gifted", relation: "Sister to N inside NP; modifies (does not govern) the head noun researcher.", semantic: "Restricts the set of possible referents of researcher to those possessing an exceptional degree of talent.", pragmatic: "Adds evaluative colouring, foregrounding the researcher's competence before the main assertion is made.",
          children: [
            { id: "AdvP1", category: "AdvP (Adverb Phrase)", name: "exceptionally", func: "Degree modifier of Adj", def: "An adverb phrase that intensifies or specifies the degree of the adjective it modifies.", example: "exceptionally", example2: "compare: remarkably, unusually", relation: "Left-adjoined to the adjective talented inside AdjP.", semantic: "Scales the property denoted by talented to an unusually high degree.", pragmatic: "Heightens emphasis, projecting a stance of admiration toward the referent.", children: [] },
            { id: "Adj1", category: "Adj (Adjective — head)", name: "talented", func: "Head of AdjP", def: "The lexical head of the adjective phrase, denoting a gradable property.", example: "talented", example2: "gradable: more talented, most talented", relation: "Governs AdvP as its degree specifier; the whole AdjP modifies N.", semantic: "Attributes the property of skill/ability to the noun it modifies.", pragmatic: "Contributes an evaluative, positive stance.", children: [] }
          ]
        },
        { id: "N1", category: "N (Noun — head)", name: "researcher", func: "Head of NP", def: "The lexical head that determines the category (nominal) and core reference of the phrase; all other elements in the NP depend on it.", example: "researcher", example2: "the phrase's category, number and person all project from this head", relation: "Governed by Det and modified by AdjP; the entire NP inherits its category and reference from this noun.", semantic: "Denotes the entity type: a person engaged in research.", pragmatic: "Provides the descriptive content by which the hearer identifies the topic referent.", children: [] }
      ]
    },
    {
      id: "VP",
      category: "VP (Verb Phrase)",
      name: "VP — Predicate",
      func: "Predicate of S",
      def: "A phrase headed by a verb that expresses what is predicated of the subject, including any objects, complements or adjuncts the verb selects.",
      example: "presented the findings to the committee",
      example2: "compare: presented the findings (PP omitted where recoverable from context)",
      relation: "Sister to the subject NP under S; the verb inside VP selects and governs its NP object and PP complement.",
      semantic: "Denotes the event predicated of the Agent: an act of presenting with a Theme and a Goal/Recipient.",
      pragmatic: "Carries the comment (new information) of the sentence, following the topic established by the subject.",
      children: [
        { id: "V1", category: "V (Verb — head)", name: "presented", func: "Head of VP", def: "The lexical head of the predicate; a ditransitive-capable verb that licenses both a direct object and a prepositional complement.", example: "presented", example2: "compare: presented / has presented / will present (tense/aspect variants)", relation: "Governs the object NP the findings and selects the PP to the committee as a complement expressing the recipient.", semantic: "Denotes a transfer-of-information event with three participants: Agent, Theme, Goal.", pragmatic: "As a past-tense form, situates the event as a completed, factual occurrence.", children: [] },
        {
          id: "NP-obj", category: "NP (Noun Phrase)", name: "the findings", func: "Direct object of V (Theme)", def: "A noun phrase functioning as the direct object, denoting the entity that undergoes or is affected by the verb's action.", example: "the findings", example2: "compare: them (pronominal substitution)", relation: "Sister to V inside VP; immediately follows the verb, as objects typically do in English canonical word order.", semantic: "Assigned the Theme role: the content that is presented.", pragmatic: "Represents given information within the discourse of a research report — the results already established prior to this sentence.",
          children: [
            { id: "Det2", category: "Det (Determiner)", name: "the", func: "Determiner of NP", def: "Marks the noun phrase as definite.", example: "the", example2: "contrast: some findings", relation: "Dependent of N within the object NP.", semantic: "Definite reference: a specific, previously established set of findings.", pragmatic: "Signals that the findings are recoverable from prior discourse or shared knowledge.", children: [] },
            { id: "N2", category: "N (Noun — head, plural)", name: "findings", func: "Head of NP", def: "The head noun denoting the results of research.", example: "findings", example2: "singular: finding", relation: "Head of the object NP; governed by Det.", semantic: "Denotes the informational content that is transferred.", pragmatic: "Anchors the Theme argument of the predicate.", children: [] }
          ]
        },
        {
          id: "PP1", category: "PP (Prepositional Phrase)", name: "to the committee", func: "Complement of V (Recipient/Goal)", def: "A phrase headed by a preposition that relates its NP object to the verb, here expressing the recipient of the presenting event.", example: "to the committee", example2: "compare: to them (pronominal object of P)", relation: "Sister to V and NP-obj inside VP; selected by present as its recipient argument, attached to VP rather than to the object NP.", semantic: "Assigns the Goal/Recipient role to the committee — the entity toward which the findings are directed.", pragmatic: "Closes the sentence with the most newsworthy participant in end-focus position, per the principle of end-weight.",
          children: [
            { id: "P1", category: "P (Preposition — head)", name: "to", func: "Head of PP", def: "A grammatical preposition selected by present to introduce its recipient argument.", example: "to", example2: "contrast: presented the committee with the findings (alternative argument realisation)", relation: "Governs the NP the committee as its complement.", semantic: "Encodes a directional/transfer relation between the Theme and the Recipient.", pragmatic: "Signals the argument structure choice (prepositional dative) rather than the double-object alternative.", children: [] },
            {
              id: "NP-obl", category: "NP (Noun Phrase)", name: "the committee", func: "Complement of P (object of preposition)", def: "A noun phrase functioning as the complement of the preposition to.", example: "the committee", example2: "compare: to it", relation: "Governed by P; together they form the PP that attaches to VP.", semantic: "Denotes the Recipient/Goal of the presenting event.", pragmatic: "Represents the audience — likely given information in an academic or institutional context.",
              children: [
                { id: "Det3", category: "Det (Determiner)", name: "the", func: "Determiner of NP", def: "Marks definiteness.", example: "the", example2: "contrast: a committee", relation: "Dependent of N.", semantic: "Definite reference to a specific, contextually identifiable committee.", pragmatic: "Assumes hearer can identify which committee.", children: [] },
                { id: "N3", category: "N (Noun — head)", name: "committee", func: "Head of NP", def: "Head noun denoting a collective body of people.", example: "committee", example2: "plural: committees", relation: "Head of the oblique NP, governed by Det and by the preposition to.", semantic: "Denotes the collective Recipient entity.", pragmatic: "Anchors the Goal argument.", children: [] }
              ]
            }
          ]
        }
      ]
    }
  ]
};

/* -------------------------------------------------------------------------
   2. CONSTITUENT EXPLORER
   ------------------------------------------------------------------------- */
const EXPLORER_DATA = [
  {
    id: "np", label: "NP", name: "Noun Phrase",
    definition: "A constituent whose head is normally a noun or pronoun, optionally accompanied by determiners, modifiers and complements.",
    structure: "(Det) + (AdjP*) + N (head) + (PP/relative clause complement)",
    head: "A noun or pronoun (e.g. researcher, findings, she).",
    functions: ["Subject", "Direct object", "Indirect object", "Object of a preposition", "Subject complement", "Appositive"],
    example: "the exceptionally talented researcher",
    advanced: "the committee that reviewed the proposal (NP with an embedded relative clause complement)",
    semantic: "Typically introduces or refers to an entity that bears a thematic role assigned by a governing verb or preposition.",
    test: "Pronoun substitution: an NP can typically be replaced by a single pronoun (the researcher → she) without a change in grammatical function.",
    boundary: "the [exceptionally talented researcher]"
  },
  {
    id: "vp", label: "VP", name: "Verb Phrase",
    definition: "A constituent headed by a verb, expressing the predicate of a clause together with its objects, complements and adjuncts.",
    structure: "V (head) + (NP object) + (PP/AdjP complement) + (AdvP adjunct)",
    head: "A lexical or auxiliary verb (e.g. presented, has been reviewing).",
    functions: ["Predicate of a finite clause", "Non-finite predicate (to-infinitive, -ing, -ed clauses)"],
    example: "presented the findings to the committee",
    advanced: "had been carefully reviewing the proposal for several weeks (VP with auxiliary sequence, adjunct AdvP, and adjunct PP)",
    semantic: "Denotes an event, state or process, and determines how many and which thematic roles are assigned.",
    test: "Do-so substitution / VP-ellipsis: a VP can be replaced by did so, or omitted under identity with an antecedent VP (She presented her findings, and he did too).",
    boundary: "the researcher [presented the findings to the committee]"
  },
  {
    id: "pp", label: "PP", name: "Prepositional Phrase",
    definition: "A constituent headed by a preposition that relates its complement NP (or clause) to another element in the sentence.",
    structure: "P (head) + NP/clause (complement)",
    head: "A preposition (e.g. to, in, with, despite).",
    functions: ["Adjunct (time, place, manner, reason)", "Complement of a verb", "Complement within an NP", "Complement of an adjective"],
    example: "to the committee",
    advanced: "in spite of the committee's initial reservations (complex preposition heading a PP adjunct of concession)",
    semantic: "Encodes spatial, temporal, causal or relational meaning linking two entities or events.",
    test: "Movement: many PP adjuncts can be fronted (To the committee, she presented her findings) while PP complements resist this more strongly — a useful diagnostic for complement vs. adjunct status.",
    boundary: "presented the findings [to the committee]"
  },
  {
    id: "adjp", label: "AdjP", name: "Adjective Phrase",
    definition: "A constituent headed by an adjective, which may itself be modified by a degree adverb and may take its own complement.",
    structure: "(AdvP degree modifier) + Adj (head) + (PP/clause complement)",
    head: "An adjective (e.g. talented, confident, aware).",
    functions: ["Attributive modifier within NP", "Subject complement", "Object complement"],
    example: "exceptionally talented",
    advanced: "confident that the findings would withstand scrutiny (AdjP with a finite clausal complement)",
    semantic: "Attributes a gradable or non-gradable property to the noun or entity it modifies or predicates of.",
    test: "Degree modification: gradable AdjPs accept very, extremely, or comparative/superlative forms, distinguishing them from non-gradable adjectives.",
    boundary: "the [exceptionally talented] researcher"
  },
  {
    id: "advp", label: "AdvP", name: "Adverb Phrase",
    definition: "A constituent headed by an adverb, which typically modifies a verb, adjective, another adverb, or an entire clause.",
    structure: "(Degree modifier) + Adv (head)",
    head: "An adverb (e.g. exceptionally, carefully, unfortunately).",
    functions: ["Modifier of Adj/Adv", "Adjunct within VP (manner, time, frequency)", "Sentence adverbial (stance/comment)"],
    example: "exceptionally",
    advanced: "quite unexpectedly, the committee reconvened (sentence-level AdvP expressing speaker stance)",
    semantic: "Specifies manner, degree, frequency, time or the speaker's evaluative stance toward the proposition.",
    test: "Positional mobility: many AdvPs can occupy several positions in the clause (Carefully, she reviewed it / She carefully reviewed it / She reviewed it carefully), a property less available to most other phrase types.",
    boundary: "[exceptionally] talented"
  },
  {
    id: "clause", label: "Clause", name: "Clause",
    definition: "A constituent built around a predicate (finite or non-finite) together with its arguments; the basic unit from which sentences are constructed.",
    structure: "(Subject) + Predicate (finite or non-finite VP) + (Complements/Adjuncts)",
    head: "The verb, finite or non-finite, that anchors the predicate.",
    functions: ["Independent clause (stands alone as a sentence)", "Dependent/subordinate clause (nominal, relative or adverbial)"],
    example: "that the researcher presented the findings",
    advanced: "having presented the findings, the researcher left the room (non-finite participial clause functioning as an adjunct)",
    semantic: "Expresses a full or partial proposition, depending on whether it is finite and independent.",
    test: "A finite independent clause can stand alone as a well-formed sentence; a dependent clause typically cannot, revealing its subordinate status.",
    boundary: "the committee agreed [that the researcher's findings were sound]"
  },
  {
    id: "dp", label: "DP", name: "Determiner Phrase",
    definition: "In some frameworks, the determiner rather than the noun is analysed as the head of the nominal constituent, projecting a DP that takes an NP complement.",
    structure: "D (head) + NP (complement)",
    head: "A determiner (e.g. the, this, every, the committee's).",
    functions: ["Subject", "Object", "Complement of a preposition — identical distribution to NP under the alternative analysis"],
    example: "the committee's exceptionally talented researcher",
    advanced: "every researcher who submitted a proposal (DP analysis foregrounds the quantificational force of every)",
    semantic: "The determiner contributes quantificational or referential force (definiteness, quantity, demonstrative reference) over the descriptive content supplied by the NP complement.",
    test: "This analysis is motivated by possessive constructions (the committee's researcher), where the possessor occupies the specifier position typically reserved for determiners.",
    boundary: "[the] committee"
  },
  {
    id: "cp", label: "CP", name: "Complementizer Phrase",
    definition: "In generative frameworks, a clause introduced by a complementizer (that, whether, if, or a null complementizer) is analysed as a CP, with the complementizer as its head and the finite clause (IP/TP) as its complement.",
    structure: "C (head: that/whether/if/Ø) + finite clause (complement)",
    head: "A complementizer (e.g. that, whether, if).",
    functions: ["Complement clause of a verb (nominal function)", "Relative clause modifying an NP", "Subordinate clause of various types"],
    example: "that the researcher presented the findings",
    advanced: "whether the committee would accept the findings remained uncertain (interrogative CP functioning as subject)",
    semantic: "The complementizer marks the clause's illocutionary type (declarative vs. interrogative) and its subordinate status.",
    test: "Complementizer deletion: that is frequently omissible when the CP is a verb complement (She said [that] she would attend), a property not shared by relative that in restrictive relative clauses in all contexts.",
    boundary: "the committee agreed [that the researcher's findings were sound]"
  }
];

/* -------------------------------------------------------------------------
   3. CLICKABLE CONSTITUENT EXAMPLE (for Constituent Explorer)
   ------------------------------------------------------------------------- */
const CLICKABLE_SENTENCE = [
  { text: "The exceptionally talented researcher", cat: "NP", func: "Subject", def: "Subject noun phrase, headed by researcher." },
  { text: "presented", cat: "V", func: "Head of VP", def: "The main verb of the predicate." },
  { text: "the findings", cat: "NP", func: "Direct object (Theme)", def: "Object noun phrase, headed by findings." },
  { text: "to the committee", cat: "PP", func: "Complement of V (Recipient)", def: "Prepositional phrase expressing the recipient of the presenting event." }
];

/* -------------------------------------------------------------------------
   4. SYNTACTIC TEST LAB
   ------------------------------------------------------------------------- */
const TESTLAB_SENTENCES = [
  { id: "s1", text: "The exceptionally talented researcher presented the findings to the committee." },
  { id: "s2", text: "The committee rejected the proposal after lengthy deliberation." },
  { id: "s3", text: "She gave the tired old professor a copy of her thesis." }
];

const TESTLAB_TESTS = {
  substitution: {
    instruction: "Substitution replaces a candidate string with a single pro-form (it, they, do so, there, then). If the substitution is grammatical and preserves meaning, the string is a constituent.",
    apply: (id) => ({
      s1: { result: "She presented them to it.", note: "\"The exceptionally talented researcher\" → she; \"the findings\" → them; \"the committee\" → it. All three substitutions succeed, confirming each as an NP constituent." },
      s2: { result: "It rejected it after lengthy deliberation.", note: "\"The committee\" → it; \"the proposal\" → it. Both substitutions succeed, confirming NP-hood. Note: \"after lengthy deliberation\" resists simple pronominal substitution, but can be replaced by then, confirming it as a PP adjunct of time." },
      s3: { result: "She gave him it. / She did so.", note: "The whole VP \"gave the tired old professor a copy of her thesis\" can be replaced by did so; the indirect object substitutes as him and the direct object as it, each independently confirming constituent status." }
    })[id]
  },
  movement: {
    instruction: "Movement (fronting) relocates a candidate string to the front of the clause. Constituents typically front as a unit; non-constituent strings generally cannot.",
    apply: (id) => ({
      s1: { result: "To the committee, the exceptionally talented researcher presented the findings.", note: "The PP fronts intact as a single unit, supporting its constituent status. By contrast, *\"Findings to the committee, the researcher presented the\" is ungrammatical, showing that \"findings to the committee\" is not a constituent." },
      s2: { result: "After lengthy deliberation, the committee rejected the proposal.", note: "The adjunct PP fronts freely, a classic property of adjuncts (as opposed to arguments, which typically resist fronting)." },
      s3: { result: "A copy of her thesis, she gave the tired old professor.", note: "The direct object NP fronts as a unit (a topicalisation structure), confirming its constituency; the indirect object resists fronting as easily in this construction, consistent with its closer syntactic bond to the verb." }
    })[id]
  },
  coordination: {
    instruction: "Coordination joins the candidate string with another string of the same category using and/or. Only constituents of like category can typically be coordinated.",
    apply: (id) => ({
      s1: { result: "The researcher presented the findings to the committee and to the board.", note: "Two PPs (\"to the committee\" and \"to the board\") coordinate naturally, confirming that each is an independent PP constituent." },
      s2: { result: "The committee rejected the proposal and the accompanying budget.", note: "\"The proposal\" coordinates with another NP, \"the accompanying budget\", confirming NP status; both are objects of rejected." },
      s3: { result: "She gave the tired old professor a copy of her thesis and a box of chocolates.", note: "The direct object NP coordinates with another NP, confirming that \"a copy of her thesis\" forms a single constituent." }
    })[id]
  },
  deletion: {
    instruction: "Deletion (ellipsis) omits the candidate string where it is recoverable from context, typically under identity with a preceding constituent. Grammatical deletion supports constituent status.",
    apply: (id) => ({
      s1: { result: "The researcher presented the findings to the committee, and the assistant did too.", note: "The entire VP is elided under did too, recoverable from the preceding clause — strong evidence that \"presented the findings to the committee\" forms a single VP constituent." },
      s2: { result: "The committee rejected the proposal, but the board did not.", note: "VP-ellipsis again targets the whole predicate \"reject the proposal\", not an arbitrary substring, showing where the constituent boundary falls." },
      s3: { result: "She gave the tired old professor a copy of her thesis, and I gave him one too.", note: "\"A copy of her thesis\" is replaced by the pro-form one, a form of surface anaphora available only to full NP constituents." }
    })[id]
  },
  clefting: {
    instruction: "Clefting places the candidate string into the focus position of an it-cleft (It is/was ___ that …). Only constituents can typically occupy this position.",
    apply: (id) => ({
      s1: { result: "It was to the committee that the researcher presented the findings.", note: "The PP occupies cleft focus position grammatically, confirming constituency and simultaneously marking it as the pragmatically focused element." },
      s2: { result: "It was the proposal that the committee rejected.", note: "Clefting the object NP is fully grammatical, and has the pragmatic effect of contrastively focusing \"the proposal\" against alternatives." },
      s3: { result: "It was the tired old professor that she gave a copy of her thesis to.", note: "Clefting the indirect object is possible but slightly more marked stylistically, illustrating that grammaticality and pragmatic naturalness are separate dimensions of evaluation." }
    })[id]
  },
  question: {
    instruction: "Question formation replaces the candidate string with an appropriate wh-word and fronts it. A felicitous wh-question targeting exactly that string supports its constituent status and reveals its category.",
    apply: (id) => ({
      s1: { result: "Who presented the findings to the committee? / What did the researcher present to the committee? / To whom did the researcher present the findings?", note: "Each wh-question isolates a distinct NP or PP constituent (subject, object, oblique), confirming three separate constituents and revealing their categories via the wh-word chosen (who/what → NP; to whom → PP)." },
      s2: { result: "What did the committee reject? / When did the committee reject the proposal?", note: "\"What\" isolates the object NP; \"when\" isolates the adjunct PP of time, distinguishing argument from adjunct by the wh-word each licenses." },
      s3: { result: "Who did she give a copy of her thesis to? / What did she give the tired old professor?", note: "Two distinct wh-questions target the indirect and direct objects respectively, confirming both as independent NP constituents." }
    })[id]
  }
};

/* -------------------------------------------------------------------------
   5. SEMANTICS & PRAGMATICS TAB PANELS
   ------------------------------------------------------------------------- */
const SEMANTICS_PANELS = {
  "semantics-argument": {
    title: "Argument Structure and Thematic Roles",
    body: [
      "A verb's argument structure specifies how many participants (arguments) it requires and what semantic roles — thematic roles — those participants bear. Present, for instance, is trivalent: it requires an Agent (the presenter), a Theme (what is presented), and typically a Goal or Recipient (to whom it is presented).",
      "Thematic roles are independent of grammatical function. In The exceptionally talented researcher presented the findings to the committee, the Agent is realised as subject and the Theme as direct object — the canonical mapping. But the same roles can be realised differently: in The findings were presented to the committee by the researcher, the Theme surfaces as subject while the Agent is demoted to an optional by-phrase, without any change to the underlying argument structure."
    ],
    examples: [
      { label: "Canonical mapping", text: "The researcher (Agent/Subject) presented the findings (Theme/Object) to the committee (Goal)." },
      { label: "Passive re-mapping", text: "The findings (Theme/Subject) were presented to the committee (Goal) by the researcher (Agent/oblique)." }
    ]
  },
  "semantics-scope": {
    title: "Scope, Attachment and Structural Ambiguity",
    body: [
      "Scope concerns which parts of a sentence a given operator or modifier semantically governs. Structural attachment — where a phrase is positioned in the tree — often determines scope directly.",
      "Consider Every researcher did not submit a proposal. Depending on whether negation is interpreted as taking scope over the quantifier or vice versa, the sentence can mean either 'no researcher submitted a proposal' or 'not every researcher submitted a proposal'. The ambiguity is genuinely structural: it reflects two distinct scope relations compatible with a single surface string, not merely vagueness of vocabulary."
    ],
    examples: [
      { label: "Wide-scope negation", text: "Interpretation 1: It is not the case that every researcher submitted a proposal (some did)." },
      { label: "Wide-scope quantifier", text: "Interpretation 2: For every researcher, it is the case that they did not submit a proposal (none did)." }
    ]
  },
  "semantics-information": {
    title: "Information Structure: Topic, Focus, Given and New",
    body: [
      "Beyond truth-conditional meaning, sentence structure organises information for the listener. The topic is what a sentence is about, typically given (already established) information, and is strongly associated with clause-initial (subject) position in English. The focus is the informationally prominent part of the sentence, often the newest or most contrastive information, and is strongly associated with clause-final position (end-focus).",
      "Because English relies heavily on word order rather than case marking, speakers exploit structural devices — passivisation, clefting, fronting — to reposition given and new information relative to these default topic and focus slots, without altering the core propositional content."
    ],
    examples: [
      { label: "Given → New (default)", text: "The committee (given/topic) reviewed the new proposal (new/focus)." },
      { label: "Reordered for focus", text: "It was the new proposal that the committee reviewed (contrastive focus on 'the new proposal')." }
    ]
  },
  "semantics-marked": {
    title: "Marked Word Order and Its Communicative Effects",
    body: [
      "Canonical English word order is Subject–Verb–Object. Departures from this order are marked: they are grammatical, but carry additional pragmatic meaning precisely because they are non-default.",
      "Fronting moves a normally post-verbal constituent to clause-initial position for contrastive topic or emphasis (Coffee, I can't stand). Inversion reverses subject–auxiliary order, often for negative-initial emphasis (Never had she seen such a result). Existential there-constructions introduce new referents without disturbing topic continuity (There emerged a serious objection). Each construction is examined in more structural detail in the Construction Lab below."
    ],
    examples: [
      { label: "Fronting", text: "The proposal, the committee ultimately rejected." },
      { label: "Negative inversion", text: "Rarely had the committee seen such a rigorous proposal." }
    ]
  }
};

/* -------------------------------------------------------------------------
   6. SENTENCE ARCHITECTURE LEVELS
   ------------------------------------------------------------------------- */
const ARCHITECTURE_LEVELS = [
  {
    id: "word", label: "Word",
    heading: "Word",
    body: "The smallest freely occurring grammatical unit, belonging to a lexical category (noun, verb, adjective, adverb, preposition, determiner, etc.) that determines how it can combine with other words.",
    unit: "researcher",
    combine: "A word projects a phrase headed by itself: the category of the head determines the category of the resulting phrase (a noun projects an NP; a verb projects a VP)."
  },
  {
    id: "phrase", label: "Phrase",
    heading: "Phrase",
    body: "A word (the head) together with its dependents — modifiers and complements — forming a single constituent that behaves as a unit for the purposes of movement, substitution and coordination.",
    unit: "the exceptionally talented researcher",
    combine: "Phrases combine with a predicate (another phrase, headed by a verb) to form a clause: the subject NP unites with the predicate VP."
  },
  {
    id: "clause", label: "Clause",
    heading: "Clause",
    body: "A subject–predicate unit built around a finite or non-finite verb, expressing a proposition. A clause may stand alone (independent) or depend on another clause (dependent/subordinate).",
    unit: "the researcher presented the findings to the committee",
    combine: "An independent clause, optionally combined with one or more dependent clauses via coordination or subordination, constitutes a sentence."
  },
  {
    id: "sentence", label: "Sentence",
    heading: "Sentence",
    body: "The maximal grammatical unit conventionally bounded by terminal punctuation, consisting of one independent clause (simple) or several clauses combined by coordination and/or subordination (compound, complex, compound-complex).",
    unit: "The exceptionally talented researcher presented the findings to the committee.",
    combine: "Sentences combine with other sentences via cohesive devices (pronouns, connectives, ellipsis, given/new patterning) to form coherent discourse."
  },
  {
    id: "discourse", label: "Discourse",
    heading: "Discourse",
    body: "A connected sequence of sentences or utterances that coheres as a unified text through referential continuity, logical connection and consistent information structure.",
    unit: "The exceptionally talented researcher presented the findings to the committee. They were met with considerable interest.",
    combine: "At the discourse level, sentence-internal choices (word order, voice, pronominalisation) are precisely the mechanisms that create — or fail to create — textual cohesion across sentence boundaries."
  }
];

/* -------------------------------------------------------------------------
   7. SENTENCE TYPES (three classification axes)
   ------------------------------------------------------------------------- */
const TYPES_STRUCTURE = [
  { name: "Simple", def: "One independent clause and no dependent clause.", example: "The committee reviewed the proposal." },
  { name: "Compound", def: "Two or more independent clauses joined by coordination (and, but, or, or a semicolon).", example: "The committee reviewed the proposal, and the board approved the funding." },
  { name: "Complex", def: "One independent clause plus at least one dependent clause.", example: "Although the proposal was ambitious, the committee approved it." },
  { name: "Compound-complex", def: "Two or more independent clauses, at least one of which also contains a dependent clause.", example: "Although the proposal was ambitious, the committee approved it, and the board released the funding." }
];
const TYPES_RELATION = [
  { name: "Coordination", def: "Two constituents of equal syntactic status are linked, typically by a coordinating conjunction.", example: "The researcher presented the findings and answered questions." },
  { name: "Subordination", def: "A dependent clause is embedded within another clause, typically functioning as an adjunct, subject or complement.", example: "Because the findings were compelling, the committee approved the funding." },
  { name: "Complementation", def: "A clause functions as an obligatory argument (complement) selected by a verb, adjective or noun.", example: "The committee confirmed that the findings were sound." },
  { name: "Relativisation", def: "A clause modifies a noun phrase, restricting or elaborating its reference, typically introduced by a relative pronoun.", example: "The proposal that the committee approved received full funding." }
];
const TYPES_FUNCTION = [
  { name: "Declarative", def: "Used to make a statement or assertion; canonical Subject–Verb order.", example: "The committee approved the proposal." },
  { name: "Interrogative", def: "Used to ask a question; typically involves subject–auxiliary inversion or a wh-word.", example: "Did the committee approve the proposal?" },
  { name: "Imperative", def: "Used to issue a directive; typically has no overt subject, understood as you.", example: "Submit the proposal by Friday." },
  { name: "Exclamative", def: "Used to express a heightened emotional evaluation; often introduced by what or how.", example: "What a compelling proposal that was!" }
];

/* -------------------------------------------------------------------------
   8. AMBIGUITY LAB
   ------------------------------------------------------------------------- */
const AMBIGUITY_DATA = [
  {
    id: "amb1",
    sentence: "I saw the man with the telescope.",
    readings: [
      {
        label: "PP attaches to the VP (instrumental reading)",
        tree: "S\n├── NP: I\n└── VP\n     ├── V: saw\n     ├── NP: the man\n     └── PP: with the telescope  (adjunct of VP)",
        paraphrase: "I used a telescope to see the man.",
        explanation: "Here the PP with the telescope attaches high, as a sister of V inside VP, functioning as an instrumental adjunct of the seeing event."
      },
      {
        label: "PP attaches inside the NP (possessive/descriptive reading)",
        tree: "S\n├── NP: I\n└── VP\n     ├── V: saw\n     └── NP\n          ├── NP: the man\n          └── PP: with the telescope  (modifier inside NP)",
        paraphrase: "I saw the man who was carrying/had a telescope.",
        explanation: "Here the PP attaches low, inside the object NP, modifying man directly — describing which man was seen, rather than how the seeing was performed."
      }
    ]
  },
  {
    id: "amb2",
    sentence: "Visiting relatives can be tiresome.",
    readings: [
      {
        label: "Gerund with object (activity reading)",
        tree: "S\n└── NP (subject, gerundive clause)\n     ├── V-ing: Visiting  (head, transitive)\n     └── NP: relatives  (object of visiting)",
        paraphrase: "The act of going to visit relatives can be tiresome.",
        explanation: "Visiting is analysed as a gerund (verbal noun) taking relatives as its direct object; the whole gerundive clause is the subject."
      },
      {
        label: "Participial adjective modifying the noun (agentive reading)",
        tree: "S\n└── NP (subject)\n     ├── AdjP: Visiting  (participial modifier)\n     └── N: relatives  (head)",
        paraphrase: "Relatives who are visiting (you) can be tiresome.",
        explanation: "Visiting is instead analysed as a participial modifier of the head noun relatives — describing relatives who happen to be visiting, rather than the activity of visiting them."
      }
    ]
  },
  {
    id: "amb3",
    sentence: "The chicken is ready to eat.",
    readings: [
      {
        label: "Chicken as Patient of eat",
        tree: "S\n├── NP: The chicken\n└── VP\n     ├── V: is\n     └── AdjP: ready [PRO to eat __ ]",
        paraphrase: "The chicken is ready to be eaten.",
        explanation: "The infinitival clause's understood object is the chicken itself — a 'tough-movement'-like construction in which the matrix subject corresponds to the gap after eat."
      },
      {
        label: "Chicken as Agent of eat",
        tree: "S\n├── NP: The chicken\n└── VP\n     ├── V: is\n     └── AdjP: ready [The chicken to eat __ (something)]",
        paraphrase: "The chicken (e.g. a pet, or personified) is ready to eat (something).",
        explanation: "Alternatively, the chicken is understood as the subject of eat, poised to perform the eating itself — a reading strongly disfavoured by real-world knowledge, but structurally available."
      }
    ]
  }
];

/* -------------------------------------------------------------------------
   9. CONSTRUCTION LAB
   ------------------------------------------------------------------------- */
const CONSTRUCTION_DATA = [
  { name: "Passive voice", form: "Object of active verb → subject; verb realised as be + past participle; Agent optionally expressed in a by-phrase.", example: "The proposal was rejected (by the committee).", effect: "Backgrounds or omits the Agent; promotes the Theme to topic position; useful when the agent is unknown, irrelevant, or deliberately de-emphasised." },
  { name: "Cleft construction", form: "It + be + focused constituent + relative-like clause (it-cleft), or a wh-clause + be + focused constituent (pseudo-cleft).", example: "It was the committee that rejected the proposal.", effect: "Isolates one constituent for contrastive or exhaustive focus, presupposing the truth of the remainder of the clause." },
  { name: "Extraposition", form: "A clausal subject is postposed to the end of the sentence, with dummy it inserted in subject position.", example: "It surprised the committee that the proposal was rejected so quickly.", effect: "Avoids a heavy, complex subject at the start of the sentence, respecting the principle of end-weight and easing processing." },
  { name: "Inversion", form: "Subject and auxiliary/verb swap canonical order, often triggered by a fronted negative or restrictive adverbial.", example: "Rarely had the committee seen such a compelling proposal.", effect: "Creates emphasis on the fronted negative/restrictive element and lends a formal, often literary register." },
  { name: "Fronting / Topicalisation", form: "A normally post-verbal constituent is moved to clause-initial position, leaving the rest of the clause in situ.", example: "That proposal, the committee rejected outright.", effect: "Marks the fronted element as a contrastive topic, often implying comparison with alternatives." },
  { name: "Existential construction", form: "Dummy there + be + indefinite NP (logical subject) + optional locative/temporal complement.", example: "There emerged a serious objection during the meeting.", effect: "Introduces a new discourse referent without disrupting an established topic; avoids an indefinite, 'heavy' subject in initial position." },
  { name: "Relative clauses", form: "A clause, introduced by a relative pronoun (who/which/that) or a zero relativiser, modifies a preceding NP.", example: "The proposal that the committee approved received full funding.", effect: "Adds restrictive (defining) or non-restrictive (supplementary) information about the head noun without starting a new sentence." },
  { name: "Complement clauses", form: "A finite or non-finite clause functions as an obligatory argument of a verb, adjective or noun.", example: "The committee confirmed that the findings were reliable.", effect: "Embeds an entire proposition as a single argument, allowing verbs of cognition, communication and evaluation to take propositional objects." },
  { name: "Reduced clauses", form: "A finite subordinate clause is reduced by omitting the subject and finite auxiliary, typically yielding a participial form.", example: "Reviewed carefully, the proposal revealed several strengths. (= After it had been reviewed carefully…)", effect: "Achieves grammatical economy and a more literary register, at the cost of requiring the reader to recover the omitted subject from context." },
  { name: "Infinitival clauses", form: "A non-finite clause headed by to + base verb form, functioning as subject, object, complement or adjunct of purpose.", example: "The committee met to evaluate the proposal.", effect: "Expresses purpose, intention or a further, dependent action, more compactly than a full finite adverbial clause (\"...so that they could evaluate...\")." },
  { name: "Participial clauses", form: "A non-finite clause headed by a present (-ing) or past (-ed/-en) participle, typically functioning as an adjunct.", example: "Having reviewed the proposal, the committee approved the funding.", effect: "Signals a temporal or causal relation to the main clause economically, and is characteristic of formal written registers." }
];

/* -------------------------------------------------------------------------
   10. ASSESSMENT — 25 QUESTIONS, 7 TYPES
   types: dropdown | toggle | mcq | checkbox | matrix | truefalse | dragdrop
   Each question: id, type, category (for results breakdown), prompt, plus
   type-specific fields, correctAnswer, explanation.
   ------------------------------------------------------------------------- */
const QUESTIONS = [
  // 1 MCQ — constituent identification
  { id: 1, type: "mcq", category: "Constituent identification",
    prompt: "In \"The proposal that the committee reviewed was ultimately rejected,\" which sequence forms a single constituent functioning as the subject of the whole sentence?",
    options: [
      "The proposal",
      "The proposal that the committee reviewed",
      "The proposal that the committee",
      "Proposal that the committee reviewed was"
    ],
    correct: 1,
    explanation: "\"The proposal that the committee reviewed\" is a single NP: the head noun proposal plus its restrictive relative clause complement. Together they behave as one unit — substitutable by it — and serve as subject of was rejected.",
    distractorNote: "Option A omits the relative clause, which is part of the same NP; Option C truncates the relative clause mid-way; Option D is not even a well-formed string, let alone a constituent."
  },
  // 2 Dropdown — grammatical function
  { id: 2, type: "dropdown", category: "Grammatical functions",
    prompt: "In \"The committee found the proposal unconvincing,\" what grammatical function does \"unconvincing\" perform?",
    options: ["Direct object", "Object complement", "Adverbial adjunct", "Subject complement"],
    correct: 1,
    explanation: "\"Unconvincing\" is predicated of the object \"the proposal\" (the proposal is unconvincing), making it an object complement — distinct from a second direct object, since found does not assign it an independent thematic role.",
  },
  // 3 Toggle — required by verb?
  { id: 3, type: "toggle", category: "Complementation",
    prompt: "In \"The researcher relied on the data,\" is the prepositional phrase \"on the data\" an argument required by the verb rely, or an optional adjunct?",
    trueLabel: "Required argument (complement)",
    falseLabel: "Optional adjunct",
    correct: true,
    explanation: "Rely is a verb that obligatorily selects a PP headed by on; omitting it (*The researcher relied) yields an incomplete, ungrammatical predicate, confirming complement status rather than optional adjunct status."
  },
  // 4 Checkbox — multi-select which are NPs
  { id: 4, type: "checkbox", category: "Phrase structure",
    prompt: "In \"The tired committee finally approved her ambitious new proposal after the meeting,\" select ALL noun phrase (NP) constituents.",
    options: [
      "The tired committee",
      "finally approved",
      "her ambitious new proposal",
      "after the meeting",
      "the meeting"
    ],
    correct: [0, 2, 4],
    explanation: "\"The tired committee\" and \"her ambitious new proposal\" are NPs (subject and object); \"the meeting\" is also an NP, functioning as the complement of the preposition after. \"finally approved\" is a VP fragment (Adv + V), and \"after the meeting\" is a PP, not an NP — though it contains one."
  },
  // 5 True/False — nuanced
  { id: 5, type: "truefalse", category: "Sentence classification",
    prompt: "\"Although the proposal was rejected, the committee praised the research design, and the researcher began revising it immediately\" is a compound-complex sentence.",
    correct: true,
    explanation: "The sentence contains two independent clauses (\"the committee praised…\" and \"the researcher began…\") joined by and, plus one dependent clause (\"Although the proposal was rejected\"). The presence of both coordination between independent clauses and at least one subordinate clause makes this compound-complex, not simply compound or complex."
  },
  // 6 Matrix — classify examples against criteria
  { id: 6, type: "matrix", category: "Clause relationships",
    prompt: "For each sentence, indicate which relationship best characterises the italicised clause's link to the rest of the sentence.",
    rows: [
      { label: "The committee approved the proposal *that the researcher submitted*." },
      { label: "The researcher revised the draft *because the committee raised concerns*." },
      { label: "The researcher presented the data, *and the committee asked several questions*." },
      { label: "The committee confirmed *that the funding had been approved*." }
    ],
    columns: ["Coordination", "Subordination (adverbial)", "Complementation", "Relativisation"],
    correct: [3, 1, 0, 2],
    explanation: "(1) is a relative clause modifying \"proposal\" → Relativisation. (2) is an adverbial clause of reason → Subordination. (3) links two independent clauses with and → Coordination. (4) is the obligatory argument of confirmed → Complementation."
  },
  // 7 Drag-drop — arrange constituents into grammatical sentence
  { id: 7, type: "dragdrop", category: "Word order",
    prompt: "Arrange the following constituents into a single well-formed declarative sentence.",
    chunks: ["to the board", "presented her findings", "the exceptionally rigorous analyst"],
    correctOrder: [2, 1, 0],
    resultSentence: "The exceptionally rigorous analyst presented her findings to the board.",
    explanation: "Canonical English order places the subject NP first, the predicate VP (verb + object) second, and the PP complement/adjunct last, reflecting both grammatical requirements and the principle of end-weight."
  },
  // 8 MCQ — ambiguity / attachment
  { id: 8, type: "mcq", category: "Syntax–semantics interface",
    prompt: "Which interpretation follows from attaching the prepositional phrase \"with binoculars\" to the VP rather than to the object NP in \"The guide spotted the eagle with binoculars\"?",
    options: [
      "The eagle was holding binoculars.",
      "The guide used binoculars to spot the eagle.",
      "The binoculars belonged to the eagle.",
      "There is no interpretive difference between the two attachments."
    ],
    correct: 1,
    explanation: "VP-attachment makes \"with binoculars\" an instrumental adjunct of the verb spotted, yielding the reading that binoculars were the instrument of spotting — structurally distinct from NP-attachment, which would describe the eagle as being with/carrying binoculars.",
  },
  // 9 Dropdown — thematic role
  { id: 9, type: "dropdown", category: "Syntax–semantics interface",
    prompt: "In \"The storm damaged the roof,\" what thematic role does \"the roof\" bear?",
    options: ["Agent", "Experiencer", "Patient/Theme", "Instrument"],
    correct: 2,
    explanation: "\"The roof\" undergoes a change of state caused by the storm; it does not act intentionally (ruling out Agent), does not perceive or feel (ruling out Experiencer), and is not the means by which the damaging occurs (ruling out Instrument). It is the entity affected — Patient/Theme."
  },
  // 10 Toggle
  { id: 10, type: "toggle", category: "Modification",
    prompt: "In \"the committee's exceptionally rigorous review process,\" is \"exceptionally\" modifying the adjective \"rigorous\" or the noun \"process\"?",
    trueLabel: "Modifies the adjective \"rigorous\"",
    falseLabel: "Modifies the noun \"process\"",
    correct: true,
    explanation: "Degree adverbs like exceptionally modify gradable adjectives, not nouns directly. \"Exceptionally\" scales the degree of rigour attributed by rigorous, forming the AdjP \"exceptionally rigorous,\" which in turn modifies process."
  },
  // 11 MCQ — coordination vs subordination
  { id: 11, type: "mcq", category: "Clause relationships",
    prompt: "Which sentence exemplifies subordination rather than coordination?",
    options: [
      "The committee reviewed the proposal, and the board approved the budget.",
      "The committee reviewed the proposal, or the deadline would be missed.",
      "Because the committee reviewed the proposal thoroughly, the board approved the budget.",
      "The committee reviewed the proposal; the board approved the budget."
    ],
    correct: 2,
    explanation: "\"Because…\" introduces a dependent adverbial clause that cannot stand alone, marking subordination. The other options join two independent clauses of equal status via and, or, or a semicolon — all instances of coordination.",
  },
  // 12 Checkbox — pragmatic effects
  { id: 12, type: "checkbox", category: "Syntax–pragmatics interface",
    prompt: "Select ALL statements that correctly describe the pragmatic effect of passivisation, as in \"The proposal was rejected by the committee.\"",
    options: [
      "It allows the Agent to be omitted entirely if irrelevant or unknown.",
      "It changes the truth-conditional (propositional) content of the sentence.",
      "It repositions the Theme into topic (subject) position.",
      "It shifts discourse prominence away from the Agent."
    ],
    correct: [0, 2, 3],
    explanation: "Passivisation is a syntactic and information-structural operation, not a truth-conditional one: it reorganises which participant occupies subject/topic position and permits Agent omission, but (holding the same participants and event) the core proposition remains equivalent. Option B is therefore false."
  },
  // 13 True/False
  { id: 13, type: "truefalse", category: "Sentence classification",
    prompt: "\"Submit your revised proposal by Friday\" is structurally a simple sentence and functionally a declarative.",
    correct: false,
    explanation: "The sentence is structurally simple (one independent clause), but functionally it is imperative, not declarative — it issues a directive, has an understood you subject, and uses the base form of the verb (submit) rather than a finite declarative form."
  },
  // 14 Matrix — argument vs adjunct across examples
  { id: 14, type: "matrix", category: "Complementation",
    prompt: "For each underlined PP, classify it as an argument (obligatory complement of the verb) or an adjunct (optional modifier).",
    rows: [
      { label: "She put the report *on the table*. (\"put\" requires a locative)" },
      { label: "She read the report *on the table*. (locative describing where the reading happened)" },
      { label: "The result depends *on the sample size*." },
      { label: "The committee met *on the following Tuesday*." }
    ],
    columns: ["Argument (complement)", "Adjunct"],
    correct: [0, 1, 0, 1],
    explanation: "Put obligatorily selects a locative PP (*She put the report is incomplete), and depend on is a fixed argument-taking verb — both PPs are arguments. The PP with read and the temporal PP with met are both freely omissible without ungrammaticality, so both are adjuncts."
  },
  // 15 Dragdrop — match constituents to functions
  { id: 15, type: "dragdrop", category: "Grammatical functions", matchMode: true,
    prompt: "Match each constituent from \"The committee awarded the exceptional researcher a prestigious grant\" to its grammatical function.",
    leftItems: ["The committee", "the exceptional researcher", "a prestigious grant"],
    rightItems: ["Subject", "Indirect object (Recipient)", "Direct object (Theme)"],
    correctPairs: [0, 1, 2],
    explanation: "In this double-object construction, \"the committee\" is the Agent/Subject, \"the exceptional researcher\" is the Recipient realised as indirect object, and \"a prestigious grant\" is the Theme realised as direct object — the reverse order from the equivalent prepositional dative (…a grant to the researcher)."
  },
  // 16 MCQ — passive/active info structure
  { id: 16, type: "mcq", category: "Syntax–pragmatics interface",
    prompt: "A researcher writes: \"Three hundred participants completed the survey. The results were then analysed using regression models.\" Why is the passive preferred in the second sentence?",
    options: [
      "Because passives are always more formal and therefore automatically superior in academic writing.",
      "Because the Agent (the researchers who analysed the data) is unknown.",
      "Because it maintains 'the results' as the continuing topic, preserving textual cohesion with the prior sentence, and the Agent is recoverable/unimportant.",
      "Because active voice is ungrammatical in this context."
    ],
    correct: 2,
    explanation: "The passive here is a cohesion device: it keeps the established discourse topic (the data/results) in subject position across sentences and omits an Agent that is recoverable from context (the researchers) and not the informational focus.",
  },
  // 17 Toggle
  { id: 17, type: "toggle", category: "Embedding and recursion",
    prompt: "Is the following sentence an example of recursive embedding: \"The proposal that the committee that the dean appointed reviewed was approved\"?",
    trueLabel: "Yes — a relative clause is embedded within another relative clause",
    falseLabel: "No — the clauses are merely coordinated",
    correct: true,
    explanation: "\"That the dean appointed\" modifies \"the committee,\" and the resulting NP \"the committee that the dean appointed\" sits inside a second relative clause (\"that … reviewed\") modifying \"the proposal.\" This nesting of one relative clause inside another is a canonical case of recursive embedding, which in principle can continue indefinitely."
  },
  // 18 Checkbox
  { id: 18, type: "checkbox", category: "Constructions",
    prompt: "Select ALL sentences that involve subject–auxiliary inversion.",
    options: [
      "Never had the committee encountered such a rigorous proposal.",
      "The committee had never encountered such a rigorous proposal.",
      "Rarely does the board reject a unanimous recommendation.",
      "It was the board that rejected the recommendation."
    ],
    correct: [0, 2],
    explanation: "Options A and C front a negative/restrictive adverbial (Never, Rarely) and invert the auxiliary before the subject (had the committee; does the board). Option B has canonical order (no inversion), and Option D is a cleft construction, a distinct phenomenon from inversion."
  },
  // 19 Dropdown — clause type
  { id: 19, type: "dropdown", category: "Clause relationships",
    prompt: "In \"Whether the committee would approve the proposal remained uncertain,\" what function does the bracketed clause \"Whether the committee would approve the proposal\" perform?",
    options: ["Adjunct of the main clause", "Subject of the main clause", "Relative clause modifying 'proposal'", "Direct object of 'remained'"],
    correct: 1,
    explanation: "The interrogative clause introduced by whether occupies the subject position of the main verb remained (it could be replaced by the pronoun it: It remained uncertain), making it a subject complement clause, not an adjunct, relative clause, or object (remained does not take a direct object)."
  },
  // 20 MCQ — presupposition/implicature
  { id: 20, type: "mcq", category: "Syntax–pragmatics interface",
    prompt: "\"It was the committee's revised methodology that resolved the dispute\" carries which presupposition?",
    options: [
      "That the dispute was never actually resolved.",
      "That something resolved the dispute.",
      "That the committee had no methodology before revision.",
      "That there was no dispute."
    ],
    correct: 1,
    explanation: "It-clefts presuppose the truth of the subordinate clause content (that something resolved the dispute) while asserting and focusing the identity of that something (the committee's revised methodology). The other options misstate or invert what a cleft presupposes.",
  },
  // 21 Truefalse — nuanced
  { id: 21, type: "truefalse", category: "Phrase structure",
    prompt: "In \"very carefully written proposal,\" \"very\" modifies the participle \"written\" directly, at the same structural level as \"carefully.\"",
    correct: false,
    explanation: "\"Very\" modifies the adverb \"carefully\" (forming the AdvP \"very carefully\"), which in turn modifies the participle \"written.\" \"Very\" and \"carefully\" are therefore not sisters at the same level; \"very\" is nested one level deeper, inside the AdvP."
  },
  // 22 Matrix — sentence type classification (structural vs functional)
  { id: 22, type: "matrix", category: "Sentence classification",
    prompt: "Classify each sentence on both axes: structural type and communicative function.",
    rows: [
      { label: "Has the committee reviewed the revised proposal yet?" },
      { label: "Submit the revised proposal before the deadline, and notify the committee." },
      { label: "What a remarkably thorough review that was!" }
    ],
    columns: ["Simple / Declarative", "Simple / Interrogative", "Compound / Imperative", "Simple / Exclamative"],
    correct: [1, 2, 3],
    explanation: "(1) is one clause with subject–auxiliary inversion and a question mark → Simple/Interrogative. (2) has two independent clauses (\"Submit…\" and \"notify…\") joined by and, both imperative → Compound/Imperative. (3) is one clause, exclamative in force, introduced by what → Simple/Exclamative."
  },
  // 23 Dragdrop — build a simplified tree by assigning categories
  { id: 23, type: "dragdrop", category: "Constituent identification", matchMode: true,
    prompt: "Match each bracketed constituent from \"[The exhausted committee] [reluctantly approved] [the ambitious proposal]\" to its correct phrase category.",
    leftItems: ["[The exhausted committee]", "[reluctantly approved]", "[the ambitious proposal]"],
    rightItems: ["NP", "VP fragment (AdvP + V)", "NP"],
    correctPairs: [0, 1, 2],
    explanation: "\"The exhausted committee\" and \"the ambitious proposal\" are both NPs (subject and object respectively); \"reluctantly approved\" is a VP-internal sequence consisting of an AdvP adjunct (reluctantly) preceding the verb head (approved)."
  },
  // 24 MCQ — coordination of unlike categories (ungrammaticality)
  { id: 24, type: "mcq", category: "Coordination",
    prompt: "Which sentence violates the general constraint that coordination joins constituents of like category and function?",
    options: [
      "The researcher was diligent and thorough.",
      "The researcher worked quickly and efficiently.",
      "*The researcher was diligent and a professor.",
      "The committee approved the proposal and rejected the budget."
    ],
    correct: 2,
    explanation: "\"Diligent\" (an AdjP, subject complement) and \"a professor\" (an NP) differ in category, and here also differ in the semantic relation they bear to the subject, producing a degraded coordination. The other options coordinate two AdjPs, two AdvPs, and two VPs respectively — all category-matched.",
  },
  // 25 Checkbox — discourse-level effects
  { id: 25, type: "checkbox", category: "Discourse effects",
    prompt: "Select ALL structural devices that can be used to mark a constituent as contrastively focused.",
    options: [
      "It-cleft (It was X that…)",
      "Simple coordination with and",
      "Pseudo-cleft (What X did was…)",
      "Fronting/topicalisation of X",
      "Adding a relative clause after X"
    ],
    correct: [0, 2, 3],
    explanation: "It-clefts, pseudo-clefts, and fronting are all established syntactic devices for marking contrastive focus or topic. Plain coordination with and does not, by itself, create focus, and adding a relative clause elaborates a referent rather than focusing it."
  }
];