import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import SetupWizard from './components/SetupWizard';
import { AppState, Difficulty, Rigor, Message, Sender, QuizState, QuizQuestion } from './types';
import { getInitialGreeting, generateQuiz, getNextResponse, analyzeIncorrectWork, generateLearningPath } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [rigor, setRigor] = useState<Rigor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [mode, setMode] = useState<'solver' | 'practice' | null>(null);
  const [awaitingTopic, setAwaitingTopic] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<string | null>(null);


  useEffect(() => {
    if (appState !== AppState.SETUP && difficulty && rigor && mode) {
      setIsLoading(true);
      getInitialGreeting(difficulty, rigor, mode).then(greeting => {
        setMessages([{ id: Date.now().toString(), sender: Sender.AI, text: greeting }]);
        setIsLoading(false);
      });
    }
  }, [appState, difficulty, rigor, mode]);

  const handleSetupComplete = (
    selectedDifficulty: Difficulty,
    selectedRigor: Rigor,
    selectedMode: 'solver' | 'practice'
  ) => {
    setDifficulty(selectedDifficulty);
    setRigor(selectedRigor);
    setMode(selectedMode);
    if (selectedMode === 'practice') {
      setAppState(AppState.PRACTICE);
      setAwaitingTopic(true);
    } else {
      setAppState(AppState.PROBLEM_SOLVER);
    }
  };

  const addMessage = (sender: Sender, text: string, options: Partial<Omit<Message, 'id' | 'sender' | 'text'>> = {}) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      text,
      ...options
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };
  
  const addAiMessage = (text: string, options: Partial<Message> = {}) => {
    const newMessage: Message = { id: Date.now().toString(), sender: Sender.AI, text, ...options };
    setMessages(prev => [...prev, newMessage]);
  }

  const handleSendMessage = async (text: string, image?: string) => {
    setIsLoading(true);

    if (appState === AppState.PRACTICE && awaitingTopic) {
        // User is providing the topic for a new quiz
        addMessage(Sender.USER, text);
        setAwaitingTopic(false);
        const topic = text;
        addAiMessage(`Excellent choice! Generating a 5-question quiz on "${topic}" for you now...`);
        const questions = await generateQuiz(topic, difficulty!, rigor!);
        setQuizState({ questions, currentQuestionIndex: 0, userAnswers: [], isComplete: false });
        presentQuestion(questions[0]);
    } else if (appState === AppState.PRACTICE && quizState && !quizState.isComplete) {
      // User is answering a quiz question
      await handleQuizAnswer(text, image);
    } else {
        // This covers PROBLEM_SOLVER mode and any general chat outside of an active quiz
        const userMessage = addMessage(Sender.USER, text, { image });
        const currentHistory = [...messages, userMessage];

        // If it's the first user message in problem solver mode, set it as the current problem
        if (appState === AppState.PROBLEM_SOLVER && messages.filter(m => m.sender === Sender.USER).length === 0) {
            setCurrentProblem(text);
        }

        const responseText = await getNextResponse(currentHistory, difficulty!, rigor!);
        
        const responseOptions = appState === AppState.PROBLEM_SOLVER 
            ? { actions: [
                { label: "Next Step", value: "next_step" },
                { label: "Create Learning Path", value: "create_learning_path" }
              ] }
            : {};
        
        addAiMessage(responseText, responseOptions);
    }

    setIsLoading(false);
  };
  
  const presentQuestion = (question: QuizQuestion) => {
      const qNum = quizState ? quizState.currentQuestionIndex + 1 : 1;
      addAiMessage(`Question ${qNum} of 5:\n\n${question.question}`);
  }
  
  const playCorrectSound = () => {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);


    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleQuizAnswer = async (answer: string, image?: string) => {
    if (!quizState) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    
    addMessage(Sender.USER, answer, { isCorrectAnswer: isCorrect });

    if (isCorrect) {
        playCorrectSound();
        const nextIndex = quizState.currentQuestionIndex + 1;
        if (nextIndex < quizState.questions.length) {
            addAiMessage("That's correct! Great job. Here's the next one.");
            setQuizState(prev => ({...prev!, currentQuestionIndex: nextIndex}));
            presentQuestion(quizState.questions[nextIndex]);
        } else {
            setQuizState(prev => ({...prev!, isComplete: true}));
            addAiMessage("You've completed the quiz! Excellent work.", { actions: [{ label: "Practice another topic", value: "practice_again" }] });
        }
    } else {
        const analysis = await analyzeIncorrectWork(currentQuestion.question, answer, image);
        addAiMessage(analysis, { userWorkRequest: !image });

        const nextIndex = quizState.currentQuestionIndex + 1;
        if (nextIndex < quizState.questions.length) {
            setQuizState(prev => ({...prev!, currentQuestionIndex: nextIndex}));
            setTimeout(() => {
                presentQuestion(quizState.questions[nextIndex]);
            }, 2000)
        } else {
            setQuizState(prev => ({...prev!, isComplete: true}));
            addAiMessage("That was the last question! You've completed the quiz.", { actions: [{ label: "Practice another topic", value: "practice_again" }] });
        }
    }
  }


  const handleActionClick = async (value: string, label: string) => {
    const userMessage = addMessage(Sender.USER, label);
    setIsLoading(true);
    
    if (value === 'practice_again') {
        addAiMessage("Great! What topic would you like to practice today?");
        setAwaitingTopic(true);
    } else if (value === 'next_step') {
        const currentHistory = [...messages, userMessage];
        const responseText = await getNextResponse(currentHistory, difficulty!, rigor!);
        addAiMessage(responseText, {actions: [
            {label: "Next Step", value: "next_step"},
            {label: "Create Learning Path", value: "create_learning_path"}
        ]});
    } else if (value === 'create_learning_path') {
        if (currentProblem) {
            const learningPathText = await generateLearningPath(currentProblem, difficulty!, rigor!);
            addAiMessage(learningPathText, {actions: [{label: "Next Step", value: "next_step"}]});
        } else {
            addAiMessage("I'm sorry, I don't seem to have the original problem. Could you please provide it again?");
        }
    }

    setIsLoading(false);
  };

  return (
    <main className="h-screen w-screen bg-gray-100 font-sans">
      <div className="h-full max-w-4xl mx-auto flex flex-col">
        {appState === AppState.SETUP ? (
          <SetupWizard onSetupComplete={handleSetupComplete} />
        ) : (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onActionClick={handleActionClick}
          />
        )}
      </div>
    </main>
  );
};

export default App;