const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Connect to local PostgreSQL instance
const DB_URL = process.env.DATABASE_URL_LOCAL || 'postgresql://postgres:1234@localhost:5432/mocktest?schema=public';

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
});

// Load the raw CSV blocks
const MOCK_1_CSV = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,hindi_option_a,hindi_option_b,hindi_option_c,hindi_option_d,correct_answer,subject,topic,difficulty,marks,negative_marks,explanation,hindi_explanation
hp-tgt-medical-hptet,1,"Modifying existing schemes to fit new information is called -","नई जानकारी के अनुरूप मौजूदा मानसिक योजनाओं में बदलाव करने की प्रक्रिया क्या कहलाती है?","Accommodation","Organisation","Equilibration","Assimilation","समायोजन","संगठन","संतुलनीकरण","आत्मसात्करण","A","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","EASY",1,0,"Answer key: A — Accommodation. पियाजे के सिद्धांत में नई जानकारी के अनुरूप मौजूदा मानसिक योजना में बदलाव करना accommodation कहलाता है।","उत्तर A (Accommodation) है। पियाजे के सिद्धांत में नई जानकारी के अनुरूप मौजूदा मानसिक योजना में बदलाव करना accommodation कहलाता है।"
hp-tgt-medical-hptet,1,"Imprinting, as a critical-period phenomenon, was studied by -","महत्त्वपूर्ण अवधि में होने वाली ‘इम्प्रिंटिंग’ प्रक्रिया का अध्ययन किसने किया था?","Mary Ainsworth","Konrad Lorenz","Harry Harlow","John Bowlby","मैरी एन्सवर्थ","कोनराड लॉरेंज","हैरी हार्लो","जॉन बोल्बी","B","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: B — Konrad Lorenz. कोनराड लॉरेंज ने imprinting के अध्ययन में महत्त्वपूर्ण योगदान दिया।","उत्तर B (Konrad Lorenz) है। कोनराड लॉरेंज ने imprinting के अध्ययन में महत्त्वपूर्ण योगदान दिया।"
hp-tgt-medical-hptet,1,"In Erikson's theory, the crisis of 'Industry vs Inferiority' occurs during -","एरिक्सन के सिद्धांत में ‘परिश्रम बनाम हीनता’ का चरण किस आयु-अवधि में आता है?","School age (6–12 years)","Adolescence","Early adulthood","Infancy","विद्यालयी आयु (6–12 वर्ष)","किशोरावस्था","प्रारंभिक वयस्कावस्था","शैशवावस्था","A","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: A — School age (6–12 years). एरिक्सन के मनोसामाजिक विकास सिद्धांत में यह चरण विद्यालयी आयु से संबंधित है।","उत्तर A (School age (6–12 years)) है। एरिक्सन के मनोसामाजिक विकास सिद्धांत में यह चरण विद्यालयी आयु से संबंधित है।"
hp-tgt-medical-hptet,1,"In Kohlberg's Stage 2 (instrumental relativist orientation), right action is determined by -","कोहलबर्ग के चरण 2 (साधनात्मक-सापेक्षवादी अभिविन्यास) में सही कार्य किस आधार पर निर्धारित होता है?","What satisfies one's own needs","Universal ethics","Social contract","Law and order","जो व्यक्ति की अपनी आवश्यकताओं को पूरा करे","सार्वभौमिक नैतिकता","सामाजिक अनुबंध","कानून और व्यवस्था","A","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: A — What satisfies one's own needs. मूल प्रश्नपत्र की उत्तर-कुंजी में विकल्प A (जो व्यक्ति की अपनी आवश्यकताओं को पूरा करे) दिया गया है।","मूल प्रश्नपत्र की उत्तर-कुंजी में विकल्प A (जो व्यक्ति की अपनी आवश्यकताओं को पूरा करे) दिया गया है।"
hp-tgt-medical-hptet,1,"In Bronfenbrenner's ecological model, the 'chronosystem' refers to -","ब्रॉनफेनब्रेनर के पारिस्थितिक मॉडल में ‘काल-तंत्र’ (chronosystem) किसे दर्शाता है?","Immediate settings","Links between settings","Cultural values","Time dimension and life transitions","तात्कालिक परिवेश","परिवेशों के बीच संबंध","सांस्कृतिक मूल्य","समय का आयाम और जीवन में होने वाले परिवर्तन","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Time dimension and life transitions. काल-तंत्र समय, जीवन की घटनाओं और परिवर्तनों के प्रभाव को दर्शाता है।","उत्तर D (Time dimension and life transitions) है। काल-तंत्र समय, जीवन की घटनाओं और परिवर्तनों के प्रभाव को दर्शाता है।"
hp-tgt-medical-hptet,1,"Under the RPwD Act 2016, 'benchmark disability' means a person with at least ______ of a specified disability.","दिव्यांगजन अधिकार अधिनियम, 2016 के अनुसार ‘मानक दिव्यांगता’ के लिए किसी निर्दिष्ट दिव्यांगता का कम-से-कम कितना प्रतिशत होना चाहिए?","40%","60%","25%","50%","40%","60%","25%","50%","A","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: A — 40%. अधिनियम में मानक दिव्यांगता की परिभाषा निर्दिष्ट दिव्यांगता के कम-से-कम 40 प्रतिशत से जुड़ी है।","उत्तर A (40%) है। अधिनियम में मानक दिव्यांगता की परिभाषा निर्दिष्ट दिव्यांगता के कम-से-कम 40 प्रतिशत से जुड़ी है।"
hp-tgt-medical-hptet,1,"An Individualised Education Programme (IEP) is best prepared by -","व्यक्तिगत शिक्षा योजना (IEP) सबसे उपयुक्त रूप से किसके द्वारा तैयार की जाती है?","The child alone","A team including teachers, parents and specialists","The principal alone","The school clerk","केवल बच्चा","शिक्षकों, अभिभावकों और विशेषज्ञों की एक टीम","केवल प्रधानाचार्य","विद्यालय का लिपिक","B","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: B — A team including teachers, parents and specialists. व्यक्तिगत शिक्षा योजना बच्चे की जरूरतों और लक्ष्यों के लिए शिक्षकों, अभिभावकों और विशेषज्ञों के सहयोग से बनाई जाती है।","उत्तर B (A team including teachers, parents and specialists) है। व्यक्तिगत शिक्षा योजना बच्चे की जरूरतों और लक्ष्यों के लिए शिक्षकों, अभिभावकों और विशेषज्ञों के सहयोग से बनाई जाती है।"
hp-tgt-medical-hptet,1,"The Braille system of reading was developed by -","ब्रेल प्रणाली का पठन का विकास किसने किया —","Valentin Haüy","Louis Braille","Helen Keller","Anne Sullivan","Valentin Haüy","लुई ब्रेल","हेलेन केलर","ऐन सुलिवन","B","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","EASY",1,0,"Answer key: B — Louis Braille. ब्रेल दृष्टिबाधित व्यक्तियों के लिए स्पर्श-आधारित पठन-लेखन प्रणाली है।","उत्तर B (Louis Braille) है। ब्रेल दृष्टिबाधित व्यक्तियों के लिए स्पर्श-आधारित पठन-लेखन प्रणाली है।"
hp-tgt-medical-hptet,1,"Cerebral palsy is primarily a disorder of -","प्रमस्तिष्क पक्षाघात मुख्य रूप से किसका विकार है?","Digestion","Hearing","Vision only","Motor control due to early brain damage","पाचन","श्रवण","केवल दृष्टि","गति नियंत्रण (प्रारंभिक मस्तिष्क क्षति के कारण)","D","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: D — Motor control due to early brain damage. प्रमस्तिष्क पक्षाघात प्रारंभिक मस्तिष्क-विकास या क्षति से जुड़ी गति और मुद्रा संबंधी स्थिति है।","उत्तर D (Motor control due to early brain damage) है। प्रमस्तिष्क पक्षाघात प्रारंभिक मस्तिष्क-विकास या क्षति से जुड़ी गति और मुद्रा संबंधी स्थिति है।"
hp-tgt-medical-hptet,1,"Down syndrome is caused by -","डाउन सिंड्रोम का कारण है —","Trisomy 13","Monosomy X","Deletion in chromosome 5","Trisomy 21","ट्राइसॉमी 13","मोनोसोमी X","विलोपन में गुणसूत्र 5","ट्राइसॉमी 21","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Trisomy 21. डाउन सिंड्रोम सामान्यतः गुणसूत्र 21 की अतिरिक्त प्रति से संबंधित है।","उत्तर D (Trisomy 21) है। डाउन सिंड्रोम सामान्यतः गुणसूत्र 21 की अतिरिक्त प्रति से संबंधित है।"
hp-tgt-medical-hptet,1,"Difficulty in handwriting despite normal intelligence is termed -","सामान्य बुद्धि होने के बावजूद लिखने में कठिनाई को क्या कहा जाता है?","Dyscalculia","Aphasia","Dyslexia","Dysgraphia","डिस्कैल्कुलिया","अफेज़िया","डिस्लेक्सिया","डिस्ग्राफिया","D","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: D — Dysgraphia. डिस्ग्राफिया लिखने और हस्तलेखन से संबंधित कठिनाई है।","उत्तर D (Dysgraphia) है। डिस्ग्राफिया लिखने और हस्तलेखन से संबंधित कठिनाई है।"
hp-tgt-medical-hptet,1,"A diagnosis of autism spectrum disorder requires persistent deficits in social communication together with -","ऑटिज़्म स्पेक्ट्रम विकार के निदान के लिए सामाजिक संचार में लगातार कठिनाइयों के साथ और किस विशेषता का होना आवश्यक है?","Restricted, repetitive patterns of behaviour","Motor paralysis","Low IQ always","Hearing loss","सीमित एवं बार-बार दोहराए जाने वाले व्यवहार के पैटर्न","गतिशीलता का पक्षाघात","हमेशा कम आईक्यू","श्रवण हानि","A","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: A — Restricted, repetitive patterns of behaviour. ऑटिज़्म स्पेक्ट्रम विकार में सामाजिक संचार की कठिनाइयों के साथ सीमित या दोहराव वाले व्यवहार भी देखे जाते हैं।","उत्तर A (Restricted, repetitive patterns of behaviour) है। ऑटिज़्म स्पेक्ट्रम विकार में सामाजिक संचार की कठिनाइयों के साथ सीमित या दोहराव वाले व्यवहार भी देखे जाते हैं।"
hp-tgt-medical-hptet,1,"The three presentations of ADHD are inattentive, hyperactive-impulsive and -","एडीएचडी (ADHD) के तीन प्रकार असावधान, अतिसक्रिय-आवेगी और कौन से हैं?","Anxious","Oppositional","Combined","Depressive","चिंताग्रस्त","विरोधी","संयुक्त (Combined)","अवसादग्रस्त","C","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: C — Combined. एडीएचडी के तीन मुख्य रूप हैं: असावधान, अतिसक्रिय और संयुक्त।","उत्तर C (Combined) है।"
hp-tgt-medical-hptet,1,"'Least restrictive environment' means placing a child with a disability -","'न्यूनतम प्रतिबंधात्मक वातावरण' का अर्थ है दिव्यांग बच्चे को रखना —","In a setting as close as possible to the regular classroom","At home only","In a special home","Away from peers","नियमित कक्षा के यथासंभव निकट परिवेश में","केवल घर पर","एक विशेष गृह में","सहपाठियों से दूर","A","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: A — In a setting as close as possible to the regular classroom.","उत्तर A है।"
hp-tgt-medical-hptet,1,"Full inclusion refers to -","पूर्ण समावेशन (Full inclusion) का अर्थ है —","Partial integration for some subjects","Home-based education","Placing all disabled students in special schools","Placing all students in regular classrooms with support","कुछ विषयों के लिए आंशिक एकीकरण","घर-आधारित शिक्षा","सभी दिव्यांग विद्यार्थियों को विशेष विद्यालयों में रखना","सभी विद्यार्थियों को सहायता के साथ नियमित कक्षाओं में रखना","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Placing all students in regular classrooms with support.","उत्तर D है।"
hp-tgt-medical-hptet,1,"A screen reader is an assistive technology mainly for -","स्क्रीन रीडर मुख्य रूप से किसके लिए एक सहायक तकनीक है?","Students with ADHD","Hearing impaired students","Gifted students","Visually impaired students","एडीएचडी वाले छात्र","श्रवण बाधित छात्र","प्रतिभाशाली छात्र","दृष्टिबाधित छात्र","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Visually impaired students. स्क्रीन रीडर दृष्टिबाधित छात्रों को डिजिटल सामग्री सुनने में मदद करता है।","उत्तर D (Visually impaired students) है।"
hp-tgt-medical-hptet,1,"An audiometer measures hearing sensitivity in -","ऑडियोमीटर श्रवण संवेदनशीलता को किसमें मापता है?","Watts","Hertz only","Decibels","Pascals","वॉट","केवल हर्ट्ज","डेसिबल (Decibels)","पास्कल","C","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: C — Decibels. ध्वनि तीव्रता को डेसिबल (dB) में मापा जाता है।","उत्तर C (Decibels) है।"
hp-tgt-medical-hptet,1,"The IQ cut-off commonly used to identify giftedness is -","प्रतिभाशालिता की पहचान के लिए आमतौर पर प्रयुक्त IQ सीमा क्या है?","100","130 and above","120","110","100","130 और उससे अधिक","120","110","B","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: B — 130 and above. 130 और उससे अधिक IQ को सामान्यतः प्रतिभाशाली माना जाता है।","उत्तर B (130 and above) है।"
hp-tgt-medical-hptet,1,"Learning disability is typically identified by a discrepancy between -","अधिगम अक्षमता की पहचान आमतौर पर किसके बीच अंतर से की जाती है?","Age and height","Hearing and vision","Marks and attendance","Potential (IQ) and achievement","आयु और कद","श्रवण और दृष्टि","अंक और उपस्थिति","क्षमता (IQ) और वास्तविक उपलब्धि","D","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: D — Potential (IQ) and achievement. क्षमता और वास्तविक उपलब्धि में विसंगति अधिगम अक्षमता का संकेत है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Which of the following is a formative assessment tool?","निम्नलिखित में से कौन-सा रचनात्मक आकलन (Formative Assessment) का उपकरण है?","Final-year thesis","External entrance test","Observation checklist","Annual board examination","अंतिम वर्ष का शोध प्रबंध","प्रवेश परीक्षा","अवलोकन चेकलिस्ट (Observation checklist)","वार्षिक बोर्ड परीक्षा","C","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: C — Observation checklist. अवलोकन चेकलिस्ट नियमित कक्षा अधिगम का सतत मूल्यांकन करती है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The 'Zone of Proximal Development' is best supported by -","‘निकटस्थ विकास क्षेत्र’ (ZPD) में सीखने के लिए किस प्रकार की सहायता सबसे उपयुक्त है?","Isolation","Rote repetition","Punishment","Scaffolding","अलगाव","रटकर दोहराव","दंड","मचान/सहारा (Scaffolding)","D","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: D — Scaffolding. वाइगोत्स्की के अनुसार मचान (Scaffolding) से छात्र ZPD पार करते हैं।","उत्तर D (Scaffolding) है।"
hp-tgt-medical-hptet,1,"The first of the four processes in Bandura's observational learning is -","बांडुरा के अवलोकन अधिगम के चार चरणों में पहला चरण कौन-सा है?","Motivation","Retention","Attention","Reproduction","अभिप्रेरणा","धारणा","अवधान (Attention)","पुनरुत्पादन","C","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: C — Attention. बांडुरा के अनुसार अवलोकन अधिगम अवधान (ध्यान देने) से शुरू होता है।","उत्तर C (Attention) है।"
hp-tgt-medical-hptet,1,"Reinforcement that is delivered after an unpredictable number of responses is -","प्रतिक्रियाओं की अप्रत्याशित संख्या के बाद दिया जाने वाला पुनर्बलन क्या कहलाता है?","Fixed ratio schedule","Variable ratio schedule","Continuous reinforcement","Fixed interval schedule","नियत अनुपात अनुसूची","परिवर्तनीय अनुपात अनुसूची (Variable ratio)","सतत पुनर्बलन","नियत अंतराल अनुसूची","B","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: B — Variable ratio schedule. परिवर्तनीय अनुपात अनुसूची सबसे स्थायी अनुक्रिया दर देती है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"A child who follows rules to avoid punishment is at Kohlberg's -","दंड से बचने के लिए नियमों का पालन करने वाला बच्चा कोहलबर्ग के किस स्तर पर है?","Post-conventional level","Pre-conventional level","Conventional level","Formal level","उत्तर-परंपरागत स्तर","पूर्व-परंपरागत स्तर (Pre-conventional)","परंपरागत स्तर","औपचारिक स्तर","B","Child Development & Pedagogy","Child Development, Learning & Pedagogy","MEDIUM",1,0,"Answer key: B — Pre-conventional level. कोहलबर्ग के अनुसार आज्ञाकारिता और दंड चरण पूर्व-परंपरागत स्तर में आता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The statement 'a test measures what it claims to measure' defines its -","'एक परीक्षण उसी का मापन करता है जिसका दावा वह करता है' - यह कथन किसको परिभाषित करता है?","Usability","Objectivity","Reliability","Validity","उपयोगिता","वस्तुनिष्ठता","विश्वसनीयता","वैधता (Validity)","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Validity. परीक्षण की वैधता यह सुनिश्चित करती है कि वह उद्देश्यपूर्ण मापन करता है।","उत्तर D (Validity) है।"
hp-tgt-medical-hptet,1,"A person who is hard of hearing and uses speech reading is helped by -","कम सुनने वाले व्यक्ति जो वाक्-पठन का उपयोग करते हैं, उन्हें किससे सहायता मिलती है?","Fast speech from the back","Dim classrooms","Lecturing while writing on the board","Face-to-face communication with good lighting","पीछे से तेज बोलना","मद्धिम रोशनी","बोर्ड पर लिखते हुए व्याख्यान","अच्छी रोशनी में आमने-सामने संवाद","D","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: D — Face-to-face communication with good lighting. ओष्ठ-पठन के लिए चेहरे पर पर्याप्त प्रकाश अनिवार्य है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Dyscalculia refers to difficulty in -","डिस्कैल्कुलिया (Dyscalculia) का अर्थ किसमें कठिनाई से है?","Mathematical reasoning and calculation","Spelling","Reading","Speech","गणितीय तर्क और गणना","वर्तनी","पठन","वाणी","A","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: A — Mathematical reasoning and calculation. डिस्कैल्कुलिया गणितीय संक्रियाओं की विशिष्ट अक्षमता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Which strategy best supports a child with dyslexia?","डिस्लेक्सिया से प्रभावित बच्चे की सहायता के लिए कौन-सी रणनीति सबसे उपयुक्त है?","Punishing reading errors","Skipping reading tasks","Reading aloud before the class","Multisensory structured phonics instruction","पठन त्रुटियों पर दंड","पठन कार्यों को छोड़ना","पूरी कक्षा के सामने जोर से पढ़वाना","बहु-संवेदी संरचित ध्वन्यात्मक निर्देश","D","Child Development & Pedagogy","Inclusive Education & Special Educational Needs","MEDIUM",1,0,"Answer key: D — Multisensory structured phonics instruction. डिस्लेक्सिया में बहु-संवेदी विधि सर्वाधिक प्रभावी होती है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The 'Pygmalion effect' in classrooms means -","कक्षा में 'पिग्मेलियन प्रभाव' (Pygmalion effect) का क्या अर्थ है?","Intelligence is fixed","Teacher expectations influence student performance","Students copy teachers","Punishment improves results","बुद्धि स्थिर होती है","शिक्षक की अपेक्षाएँ छात्र के प्रदर्शन को प्रभावित करती हैं","छात्र शिक्षक की नकल करते हैं","दंड परिणामों में सुधार करता है","B","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: B — Teacher expectations influence student performance. उच्च शिक्षक अपेक्षाओं से बेहतर छात्र प्रदर्शन प्राप्त होता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Which of the following is an example of a fine motor skill?","निम्नलिखित में से कौन-सा सूक्ष्म गत्यात्मक कौशल (Fine Motor Skill) का उदाहरण है?","Jumping","Buttoning a shirt","Running","Climbing","कूदना","कमीज का बटन लगाना","दौड़ना","चढ़ना","B","Child Development & Pedagogy","Psychology & Teaching-Learning Processes","MEDIUM",1,0,"Answer key: B — Buttoning a shirt. छोटी मांसपेशियों और अंगुलियों का समन्वय सूक्ष्म गत्यात्मक कौशल है।","उत्तर B (Buttoning a shirt) है।"
hp-tgt-medical-hptet,1,"Shimla was declared the summer capital of British India in -","ब्रिटिश भारत की ग्रीष्मकालीन राजधानी शिमला को किस वर्ष घोषित किया गया था?","1947","1857","1864","1911","1947","1857","1864","1911","C","General Awareness","General Awareness & HP GK","EASY",1,0,"Answer key: C — 1864. जॉन लॉरेंस के कार्यकाल में शिमला को 1864 में आधिकारिक ग्रीष्मकालीन राजधानी बनाया गया।","उत्तर C (1864) है।"
hp-tgt-medical-hptet,1,"Dharamshala was declared the second (winter) capital of Himachal Pradesh in -","धर्मशाला को हिमाचल प्रदेश की दूसरी (शीतकालीन) राजधानी किस वर्ष घोषित किया गया था?","2005","1971","2012","2017","2005","1971","2012","2017","D","General Awareness","General Awareness & HP GK","EASY",1,0,"Answer key: D — 2017. धर्मशाला को 2017 में दूसरी राजधानी घोषित किया गया।","उत्तर D (2017) है।"
hp-tgt-medical-hptet,1,"The largest glacier of Himachal Pradesh is -","हिमाचल प्रदेश का सबसे बड़ा हिमनद (ग्लेशियर) कौन-सा है?","Gangotri","Siachen","Parbati","Bara Shigri","गंगोत्री","सियाचिन","पार्वती","बड़ा शिगड़ी","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — Bara Shigri. बड़ा शिगड़ी लाहौल-स्पीति जिले में स्थित सबसे बड़ा ग्लेशियर है।","उत्तर D (Bara Shigri) है।"
hp-tgt-medical-hptet,1,"The Pong Dam Lake was declared a Ramsar site in -","पोंग बांध झील को रामसर आर्द्रभूमि स्थल किस वर्ष घोषित किया गया था?","1990","1975","2015","2002","1990","1975","2015","2002","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — 2002. पोंग डैम झील को 2002 में रामसर स्थल घोषित किया गया।","उत्तर D (2002) है।"
hp-tgt-medical-hptet,1,"The Himachal Pradesh Panchayati Raj Act was enacted in -","हिमाचल प्रदेश पंचायती राज अधिनियम किस वर्ष पारित किया गया था?","1976","1988","1994","1968","1976","1988","1994","1968","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — 1994. हिमाचल प्रदेश पंचायती राज अधिनियम 1994 में लागू किया गया।","उत्तर C (1994) है।"
hp-tgt-medical-hptet,1,"The Shimla Agreement of 1972 was signed at -","1972 का ऐतिहासिक शिमला समझौता किस भवन में हस्ताक्षरित हुआ था?","Rothney Castle","Barnes Court","Viceregal Lodge","Peterhoff","रॉथनी कैसल","बार्नेस कोर्ट (राजभवन)","वाइसरीगल लॉज","पीटरहॉफ","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — Barnes Court. 2 जुलाई 1972 को इंदिरा गांधी और जुल्फिकार अली भुट्टो ने बार्नेस कोर्ट में हस्ताक्षर किए।","उत्तर B (Barnes Court) है।"
hp-tgt-medical-hptet,1,"Rohtang Pass is at an altitude of about -","रोहतांग दर्रा लगभग कितनी ऊँचाई पर स्थित है?","2,100 m","3,980 m","5,300 m","1,500 m","2,100 मीटर","3,978–3,980 मीटर","5,300 मीटर","1,500 मीटर","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — 3,980 m. रोहतांग दर्रा पीर पंजाल श्रेणी में लगभग 3,978 मीटर की ऊँचाई पर है।","उत्तर B (3,980 m) है।"
hp-tgt-medical-hptet,1,"The largest Harappan site in India (Haryana) is -","भारत (हरियाणा) में स्थित हड़प्पा सभ्यता का सबसे बड़ा स्थल कौन-सा है?","Kalibangan","Rakhigarhi","Banawali","Dholavira","कालीबंगा","राखीगढ़ी","बनावली","धोलावीरा","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — Rakhigarhi. राखीगढ़ी हिसार, हरियाणा में भारत का सबसे बड़ा सिंधु घाटी स्थल है।","उत्तर B (Rakhigarhi) है।"
hp-tgt-medical-hptet,1,"The Fourth Buddhist Council under Kanishka was held at -","कनिष्क के संरक्षण में चतुर्थ बौद्ध संगीति कहाँ आयोजित की गई थी?","Kundalvana (Kashmir)","Rajgriha","Vaishali","Pataliputra","कुंडलवन (कश्मीर)","राजगृह","वैशाली","पाटलिपुत्र","A","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: A — Kundalvana (Kashmir). वसुमित्र की अध्यक्षता में चतुर्थ संगीति कुंडलवन, कश्मीर में हुई।","उत्तर A (Kundalvana) है।"
hp-tgt-medical-hptet,1,"The Uttaramerur inscription describes the local self-government of the -","उत्तरमेरूर अभिलेख किस साम्राज्य के स्थानीय स्वशासन का विस्तृत विवरण देता है?","Mauryas","Guptas","Mughals","Cholas","मौर्य","गुप्त","मुगल","चोल (Cholas)","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — Cholas. चोल काल का उत्तरमेरूर अभिलेख ग्राम सभा प्रणाली की जानकारी देता है।","उत्तर D (Cholas) है।"
hp-tgt-medical-hptet,1,"The Ghadar Party was founded in 1913 by -","गदर पार्टी की स्थापना 1913 में सैन फ्रांसिस्को में किसने की थी?","Subhas Bose","Tilak","Lala Har Dayal","Bhagat Singh","सुभाष बोस","तिलक","लाला हरदयाल","भगत सिंह","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Lala Har Dayal. सोहन सिंह भकना और लाला हरदयाल ने गदर पार्टी की स्थापना की।","उत्तर C (Lala Har Dayal) है।"
hp-tgt-medical-hptet,1,"The Home Rule Leagues were started in 1916 by -","1916 में होमरूल लीग की शुरुआत किसके द्वारा की गई थी?","Gokhale and Naoroji","Gandhi and Nehru","Tilak and Annie Besant","Jinnah and Iqbal","गोखले और नौरोजी","गांधी और नेहरू","बाल गंगाधर तिलक और एनी बेसेंट","जिन्ना और इकबाल","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Tilak and Annie Besant. 1916 में तिलक और एनी बेसेंट ने अलग-अलग होमरूल लीग शुरू की।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Lala Lajpat Rai was fatally injured during a protest against the -","लाला लाजपत राय किस आयोग के विरोध प्रदर्शन के दौरान घातक रूप से घायल हुए थे?","Cabinet Mission","Cripps Mission","Simon Commission","Rowlatt Act","कैबिनेट मिशन","क्रिप्स मिशन","साइमन कमीशन (Simon Commission)","रॉलेट एक्ट","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Simon Commission. 1928 में लाहौर में साइमन कमीशन विरोधी प्रदर्शन पर लाठीचार्ज हुआ।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The Constituent Assembly of India held its first meeting on -","भारत की संविधान सभा की पहली बैठक किस तारीख को आयोजित हुई थी?","26 November 1949","15 August 1947","9 December 1946","26 January 1950","26 नवंबर 1949","15 अगस्त 1947","9 दिसंबर 1946","26 जनवरी 1950","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — 9 December 1946. संविधान सभा की प्रथम बैठक 9 दिसंबर 1946 को डॉ. सच्चिदानंद सिन्हा की अध्यक्षता में हुई।","उत्तर C (9 December 1946) है।"
hp-tgt-medical-hptet,1,"The Objective Resolution in the Constituent Assembly was moved by -","संविधान सभा में ऐतिहासिक 'उद्देश्य प्रस्ताव' किसने पेश किया था?","Jawaharlal Nehru","Rajendra Prasad","K.M. Munshi","B.R. Ambedkar","जवाहरलाल नेहरू","राजेंद्र प्रसाद","के.एम. मुंशी","बी.आर. आंबेडकर","A","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: A — Jawaharlal Nehru. 13 दिसंबर 1946 को पं. नेहरू ने उद्देश्य प्रस्ताव पेश किया।","उत्तर A (Jawaharlal Nehru) है।"
hp-tgt-medical-hptet,1,"Fundamental Duties are listed in Article -","भारतीय संविधान में मौलिक कर्तव्यों को किस अनुच्छेद में सूचीबद्ध किया गया है?","44","21A","51A","32","अनुच्छेद 44","अनुच्छेद 21A","अनुच्छेद 51A","अनुच्छेद 32","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — 51A. 42वें संविधान संशोधन 1976 द्वारा भाग IV-A में अनुच्छेद 51A जोड़ा गया।","उत्तर C (51A) है।"
hp-tgt-medical-hptet,1,"The Chairperson of NITI Aayog is the -","नीति आयोग (NITI Aayog) के पदेन अध्यक्ष कौन होते हैं?","President","Prime Minister","Finance Minister","Vice-President","राष्ट्रपति","प्रधानमंत्री","वित्त मंत्री","उपराष्ट्रपति","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — Prime Minister. भारत के प्रधानमंत्री नीति आयोग के पदेन अध्यक्ष होते हैं।","उत्तर B (Prime Minister) है।"
hp-tgt-medical-hptet,1,"The largest inland salt lake in India is -","भारत की सबसे बड़ी अंतर्देशीय खारे पानी की झील कौन-सी है?","Chilika","Sambhar","Wular","Pulicat","चिल्का","सांभर झील (राजस्थान)","वूलर","पुलिकट","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — Sambhar. सांभर झील राजस्थान में भारत की सबसे बड़ी अंतर्देशीय नमक झील है।","उत्तर B (Sambhar) है।"
hp-tgt-medical-hptet,1,"The Siachen Glacier is located in the -","सियाचिन ग्लेशियर किस पर्वत श्रृंखला में स्थित है?","Karakoram range","Pir Panjal range","Shivalik range","Zanskar range","काराकोरम श्रेणी","पीर पंजाल श्रेणी","शिवालिक श्रेणी","जांस्कर श्रेणी","A","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: A — Karakoram range. सियाचिन ग्लेशियर पूर्वी काराकोरम श्रेणी में स्थित है।","उत्तर A (Karakoram range) है।"
hp-tgt-medical-hptet,1,"The headquarters of the World Health Organization is in -","विश्व स्वास्थ्य संगठन (WHO) का मुख्यालय कहाँ स्थित है?","Vienna","Geneva","Paris","New York","विएना","जिनेवा (स्विट्जरलैंड)","पेरिस","न्यूयॉर्क","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — Geneva. WHO का मुख्यालय जिनेवा में स्थित है।","उत्तर B (Geneva) है।"
hp-tgt-medical-hptet,1,"India's Chandrayaan-3 soft-landed near the lunar south pole in -","भारत के चंद्रयान-3 ने चंद्रमा के दक्षिणी ध्रुव के पास सॉफ्ट-लैंडिंग किस वर्ष की?","2021","2019","2025","2023","2021","2019","2025","2023 (23 अगस्त)","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — 2023. 23 अगस्त 2023 को चंद्रयान-3 सफलतापूर्वक उतरा।","उत्तर D (2023) है।"
hp-tgt-medical-hptet,1,"Bharatanatyam originated in -","शास्त्रीय नृत्य भरतनाट्यम की उत्पत्ति किस राज्य में हुई?","Odisha","Manipur","Tamil Nadu","Kerala","ओडिशा","मणिपुर","तमिलनाडु","केरल","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Tamil Nadu. भरतनाट्यम तमिलनाडु का प्राचीन शास्त्रीय नृत्य है।","उत्तर C (Tamil Nadu) है।"
hp-tgt-medical-hptet,1,"Kathak is a classical dance form associated mainly with -","कथक मुख्य रूप से किस क्षेत्र का शास्त्रीय नृत्य है?","Kerala","North India","South India","Assam","केरल","उत्तर भारत (North India)","दक्षिण भारत","असम","B","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: B — North India. कथक उत्तर भारत (विशेषकर उत्तर प्रदेश) का प्रमुख शास्त्रीय नृत्य है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The first Indians to receive the Bharat Ratna (1954) included -","1954 में भारत रत्न प्राप्त करने वाले प्रथम व्यक्तियों में कौन शामिल थे?","Patel and Ambedkar","Nehru and Gandhi","C. Rajagopalachari, S. Radhakrishnan and C.V. Raman","Tagore and Bose","पटेल और आंबेडकर","नेहरू और गांधी","सी. राजगोपालाचारी, सर्वपल्ली राधाकृष्णन और सी.वी. रमन","टैगोर और बोस","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — C. Rajagopalachari, S. Radhakrishnan and C.V. Raman. 1954 में इन तीनों को प्रथम भारत रत्न दिया गया।","उत्तर C है।"
hp-tgt-medical-hptet,1,"C.V. Raman won the Nobel Prize in Physics in -","सी.वी. रमन को भौतिकी का नोबेल पुरस्कार किस वर्ष मिला था?","1947","1913","1968","1930","1947","1913","1968","1930","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — 1930. रमन प्रभाव की खोज के लिए 1930 में नोबेल पुरस्कार प्रदान किया गया।","उत्तर D (1930) है।"
hp-tgt-medical-hptet,1,"Neeraj Chopra won a silver medal in javelin at the Olympics held at -","नीरज चोपड़ा ने भाला फेंक में रजत पदक किस ओलंपिक में जीता?","Tokyo 2020","Rio 2016","Paris 2024","London 2012","टोक्यो 2020","रियो 2016","पेरिस 2024","लंदन 2012","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Paris 2024. पेरिस 2024 में नीरज चोपड़ा ने 89.45 मीटर थ्रो के साथ रजत पदक जीता।","उत्तर C (Paris 2024) है।"
hp-tgt-medical-hptet,1,"The G20 Leaders' Summit of 2023 was hosted by -","2023 का जी-20 शिखर सम्मेलन किस देश द्वारा आयोजित किया गया था?","India","Indonesia","Brazil","Italy","भारत (नई दिल्ली)","इंडोनेशिया","ब्राजील","इटली","A","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: A — India. भारत मंडपम, नई दिल्ली में सितंबर 2023 में 18वाँ शिखर सम्मेलन संपन्न हुआ।","उत्तर A (India) है।"
hp-tgt-medical-hptet,1,"Digital India programme was launched in -","डिजिटल इंडिया कार्यक्रम का शुभारंभ किस वर्ष हुआ था?","2015","2010","2005","2018","2015 (1 जुलाई)","2010","2005","2018","A","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: A — 2015. 1 जुलाई 2015 को डिजिटल इंडिया अभियान प्रारंभ किया गया।","उत्तर A (2015) है।"
hp-tgt-medical-hptet,1,"The Unified Payments Interface (UPI) was launched in -","यूनिफाइड पेमेंट्स इंटरफेस (UPI) किस वर्ष लॉन्च किया गया था?","2013","2011","2019","2016","2013","2011","2019","2016 (अप्रैल)","D","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: D — 2016. NPCI द्वारा 2016 में UPI प्रणाली शुरू की गई।","उत्तर D (2016) है।"
hp-tgt-medical-hptet,1,"Which gas is used by plants in photosynthesis and is a major greenhouse gas?","पौधों द्वारा प्रकाश संश्लेषण में उपयोग की जाने वाली तथा प्रमुख ग्रीनहाउस गैस कौन-सी है?","Methane","Nitrous oxide","Carbon dioxide","Ozone","मीथेन","नाइट्रस ऑक्साइड","कार्बन डाइऑक्साइड (CO₂)","ओजोन","C","General Awareness","General Awareness & HP GK","MEDIUM",1,0,"Answer key: C — Carbon dioxide. पौधे CO₂ ग्रहण कर O₂ मुक्त करते हैं।","उत्तर C (Carbon dioxide) है।"
hp-tgt-medical-hptet,1,"ATP synthase (F₀F₁ particles) is located on the -","एटीपी सिंथेज (F₀F₁ कण) माइटोकॉन्ड्रिया में कहाँ स्थित होते हैं?","Outer mitochondrial membrane","Intermembrane space","Inner mitochondrial membrane","Mitochondrial matrix","बाहरी झिल्ली","अंतर-झिल्ली अवकाश","आंतरिक माइटोकॉन्ड्रियल झिल्ली","मैट्रिक्स","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Inner mitochondrial membrane. F₀F₁ कण आंतरिक झिल्ली के क्रिस्टी पर स्थित होते हैं।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The nucleolus is mainly concerned with -","केंद्रिका (Nucleolus) का मुख्य कार्य किससे संबंधित है?","Lipid synthesis","mRNA splicing","rRNA synthesis and ribosome subunit assembly","Protein glycosylation","लिपिड संश्लेषण","mRNA स्प्लिसिंग","rRNA संश्लेषण और राइबोसोम सब-यूनिट निर्माण","प्रोटीन ग्लाइकोसिलेशन","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — rRNA synthesis and ribosome subunit assembly. केंद्रिका राइबोसोमल आरएनए बनाती है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Which of the following cell structures lacks a membrane?","निम्नलिखित में से कौन-सी कोशिका संरचना झिल्ली-विहीन (Non-membrane bound) है?","Lysosome","Ribosome","Golgi body","Peroxisome","लाइसोसोम","राइबोसोम (Ribosome)","गॉल्जी काय","पेरोक्सीसोम","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Ribosome. राइबोसोम और सेंट्रोसोम झिल्ली रहित होते हैं।","उत्तर B (Ribosome) है।"
hp-tgt-medical-hptet,1,"A cell with 2n = 10 has ______ chromatids at metaphase of mitosis.","2n = 10 वाली कोशिका में समसूत्री विभाजन की मध्यावस्था (Metaphase) में कितने क्रोमैटिड होते हैं?","40","5","20","10","40","5","20","10","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — 20. प्रत्येक गुणसूत्र में 2 सिस्टर क्रोमैटिड होते हैं, अतः 10 × 2 = 20।","उत्तर C (20) है।"
hp-tgt-medical-hptet,1,"Crossing over occurs at which stage of meiotic prophase I?","अर्धसूत्री विभाजन के प्रोफेज-I की किस उप-अवस्था में क्रॉसिंग ओवर होता है?","Leptotene","Diakinesis","Zygotene","Pachytene","लेप्टोटीन","डायकाइनेसिस","जाइगोटीन","पैकाइटीन (Pachytene)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Pachytene. नॉन-सिस्टर क्रोमैटिड के बीच जीन विनिमय पैकाइटीन अवस्था में होता है।","उत्तर D (Pachytene) है।"
hp-tgt-medical-hptet,1,"A cell in G₂ phase has DNA content of -","यदि G₁ में डीएनए C है, तो G₂ अवस्था में कोशिका का डीएनए स्तर क्या होगा?","8C","C","2C","4C","8C","C","2C","4C (दोगुना)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — 4C. एस-फेज में डीएनए का प्रतिकृतियन होने से मात्रा 2C से बढ़कर 4C हो जाती है।","उत्तर D (4C) है।"
hp-tgt-medical-hptet,1,"A peptide bond is formed between -","पेप्टाइड बंध किसके बीच बनता है?","Two carboxyl groups","The carboxyl group of one amino acid and the amino group of another","Two R groups","Two amino groups","दो कार्बोक्सिल समूहों","एक अमीनो अम्ल के -COOH और दूसरे के -NH₂ समूह के बीच","दो R समूहों","दो अमीनो समूहों","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B. जल का एक अणु निष्कासित होकर पेप्टाइड बंध (-CONH-) बनता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"A competitive inhibitor of an enzyme -","एक एंजाइम का प्रतिस्पर्धी संदमक (Competitive Inhibitor) क्या करता है?","Increases Vmax","Increases apparent Km without changing Vmax","Decreases both Km and Vmax","Decreases Vmax without changing Km","Vmax बढ़ाता है","Vmax अपरिवर्तित रखते हुए Km का मान बढ़ा देता है","Km और Vmax दोनों घटाता है","Km अपरिवर्तित रखते हुए Vmax घटाता है","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Increases apparent Km without changing Vmax. यह सक्रिय स्थल के लिए क्रियाधार से प्रतिस्पर्धा करता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Sucrose is formed by a glycosidic bond between -","सुक्रोज किसके बीच ग्लाइकोसिडिक बंध से बनता है?","Glucose and galactose","Fructose and galactose","Two glucose units","Glucose and fructose","ग्लूकोज और गैलेक्टोज","फ्रुक्टोज और गैलेक्टोज","दो ग्लूकोज इकाइयाँ","ग्लूकोज और फ्रुक्टोज","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Glucose and fructose. सुक्रोज एक गैर-अपचायक डाइसैकेराइड है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Cellulose is a polymer of -","सेल्युलोज किसका बहुलक है?","Galactose","β-D-glucose","Fructose","α-D-glucose","गैलेक्टोज","β-D-ग्लूकोज","फ्रुक्टोज","α-D-ग्लूकोज","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — β-D-glucose. सेल्युलोज β-1,4-ग्लाइकोसिडिक बंधों से जुड़ी सीधी शृंखला है।","उत्तर B (β-D-glucose) है।"
hp-tgt-medical-hptet,1,"The first stable product of the C₄ pathway is -","C₄ चक्र का प्रथम स्थायी उत्पाद कौन-सा है?","3-phosphoglyceric acid","Oxaloacetic acid","Malic acid only","Pyruvic acid","3-फॉस्फोग्लिसरिक एसिड","ऑक्सालोएसिटिक एसिड (OAA)","केवल मैलिक एसिड","पाइरुविक एसिड","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Oxaloacetic acid. OAA एक 4-कार्बन वाला यौगिक है।","उत्तर B (Oxaloacetic acid) है।"
hp-tgt-medical-hptet,1,"Kranz anatomy is characteristic of -","क्रैंज शारीरिक संरचना (Kranz anatomy) किसकी प्रमुख विशेषता है?","CAM plants only","C₄ plants","Gymnosperms","C₃ plants","केवल CAM पौधे","C₄ पौधे (उदा. मक्का, गन्ना)","जिम्नोस्पर्म","C₃ पौधे","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — C₄ plants. बंडल शीथ कोशिकाओं में हरित लवक की विशेष व्यवस्था क्रैंज कहलाती है।","उत्तर B (C₄ plants) है।"
hp-tgt-medical-hptet,1,"Photorespiration involves the organelles -","प्रकाश-श्वसन (Photorespiration) में कौन-से तीन कोशिकांग भाग लेते हैं?","ER and ribosome","Chloroplast, peroxisome and mitochondrion","Nucleus and Golgi","Chloroplast only","ईआर और राइबोसोम","क्लोरोप्लास्ट, पेरोक्सीसोम और माइटोकॉन्ड्रिया","केंद्रक और गॉल्जी","केवल क्लोरोप्लास्ट","B","Biology","Botany & Zoology","HARD",1,0,"Answer key: B — Chloroplast, peroxisome and mitochondrion. यह C₂ चक्र इन तीन कोशिकांगों में क्रमिक रूप से चलता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The cohesion–tension theory of ascent of sap was proposed by -","रसारोहण का संसंजन-तनाव सिद्धांत किसने प्रतिपादित किया था?","Priestley","Munch","Dixon and Joly","Hales","प्रीस्टले","मंच","डिक्सन और जॉली (1894)","हेल्स","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Dixon and Joly. वाष्पोत्सर्जन खिंचाव और संसंजन बल रसारोहण संचालित करते हैं।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Apical dominance is mainly due to -","शीर्ष प्रमुखता (Apical dominance) मुख्य रूप से किस पादप हार्मोन के कारण होती है?","Cytokinin","Ethylene","Gibberellin","Auxin","साइटोकाइनिन","एथिलीन","जिबरेलिन","ऑक्सिन (Auxin)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Auxin. शीर्ष कलिका में बनने वाला ऑक्सिन पार्श्व कलिकाओं की वृद्धि रोकता है।","उत्तर D (Auxin) है।"
hp-tgt-medical-hptet,1,"Phytochrome is converted from Pr to Pfr form by -","फाइटोक्रोम Pr रूप से Pfr रूप में किसके अवशोषण द्वारा परिवर्तित होता है?","Blue light","Red light","Far-red light","UV light","नीला प्रकाश","लाल प्रकाश (660 nm)","सुदूर-लाल प्रकाश","पराबैंगनी प्रकाश","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Red light. 660 nm का लाल प्रकाश Pr को सक्रिय Pfr रूप में बदलता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Abscisic acid causes -","एब्सिसिक एसिड (ABA) का मुख्य प्रभाव क्या है?","Cell division","Stem elongation","Stomatal closure","Fruit ripening","कोशिका विभाजन","तने का लंबा होना","रंध्रों का बंद होना (Stomatal closure)","फल पकना","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Stomatal closure. तनाव की स्थिति में ABA रंध्रों को बंद कर जल हानि रोकता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"A dicot stem vascular bundle is -","द्विबीजपत्री तने का संवहन बंडल कैसा होता है?","Radial","Closed, conjoint and collateral","Open, conjoint and collateral","Open and concentric","अरीय","संयुक्त, संपार्श्विक एवं बंद","संयुक्त, संपार्श्विक एवं खुला (Open, with cambium)","खुला और संकेंद्रीय","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Open, conjoint and collateral. जाइलम और फ्लोएम के बीच कैम्बियम होने से यह खुला कहलाता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"In secondary growth, the cork cambium gives rise to phellem on the outside and ______ on the inside.","द्वितीयक वृद्धि में कॉर्क कैम्बियम बाहर की ओर कॉर्क और अंदर की ओर क्या बनाता है?","Phloem","Phelloderm","Xylem","Pericycle","फ्लोएम","फेलोडर्म (द्वितीयक कॉर्टेक्स)","जाइलम","पेरीसाइकिल","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Phelloderm. फेलोजन बाहर फेलम तथा भीतर फेलोडर्म बनाता है।","उत्तर B (Phelloderm) है।"
hp-tgt-medical-hptet,1,"An epigynous flower has -","जायंगोपरिक (Epigynous) पुष्प में अंडाशय कैसा होता है?","Half-inferior ovary","Inferior ovary","Superior ovary","Hypogynous thalamus","अर्ध-अधोवर्ती","अधोवर्ती (Inferior ovary)","ऊर्ध्ववर्ती","अधोजांगी पुष्पासन","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Inferior ovary. पुष्पासन अंडाशय को पूरी तरह घेरकर दलपुंज आदि ऊपर रखता है (उदा. अमरूद, खीरा)।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The endosperm in angiosperms is formed by triple fusion and is -","आवृतबीजी पौधों में त्रिसंलयन द्वारा बना भ्रूणपोष (Endosperm) कैसा होता है?","Haploid","Tetraploid","Diploid","Triploid","अगुणित (n)","चतुर्गुणित (4n)","द्विगुणित (2n)","त्रिगुणित (3n)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Triploid. एक नर युग्मक (n) और दो ध्रुवीय केंद्रक (2n) मिलकर 3n भ्रूणपोष बनाते हैं।","उत्तर D (Triploid) है।"
hp-tgt-medical-hptet,1,"The aleurone layer of cereal grains is rich in -","अनाज के दानों की एल्यूरॉन परत में प्रचुर मात्रा में क्या पाया जाता है?","Protein","Starch","Oil","Cellulose","प्रोटीन (Protein)","स्टार्च","तेल","सेल्युलोज","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Protein. एल्यूरॉन परत भ्रूणपोष के बाहर प्रोटीन से भरपूर आवरण होती है।","उत्तर A (Protein) है।"
hp-tgt-medical-hptet,1,"Placentation in Solanaceae is typically -","सोलेनेसी (Solanaceae) कुल में बीजांडन्यास आमतौर पर कैसा होता है?","Free central","Axile","Marginal","Parietal","मुक्त केंद्रीय","स्तंभीय (Axile with swollen placenta)","सीमांत","भित्तीय","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Axile. सोलेनेसी में फूले हुए बीजांडासन पर स्तंभीय बीजांडन्यास होता है।","उत्तर B (Axile) है।"
hp-tgt-medical-hptet,1,"Lowering of blood pH shifts the oxygen–haemoglobin dissociation curve to the -","रक्त का pH कम होने (अम्लीयता बढ़ने) पर ऑक्सीजन-हीमोग्लोबिन वियोजन वक्र किस ओर विस्थापित होता है?","Right","Upward","Left","Neither","दाईं ओर (Bohr effect)","ऊपर","बाईं ओर","किसी ओर नहीं","A","Biology","Botany & Zoology","HARD",1,0,"Answer key: A — Right. इसे बोहर प्रभाव (Bohr effect) कहते हैं, जिससे ऊतकों को अधिक O₂ मिलती है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The first heart sound ('lub') is due to the closure of -","हृदय की प्रथम ध्वनि ('लब') किसके बंद होने के कारण उत्पन्न होती है?","Aortic valve only","Semilunar valves","Pulmonary valve only","Tricuspid and bicuspid valves","केवल महाधमनी कपाट","अर्धचंद्राकार कपाट","केवल फुफ्फुसीय कपाट","त्रिवलनी और द्विवलनी (AV) कपाट","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Tricuspid and bicuspid valves. निलय संकुचन की शुरुआत में AV कपाट बंद होते हैं।","उत्तर D है।"
hp-tgt-medical-hptet,1,"ADH acts mainly on the -","एंटीडाईयूरेटिक हार्मोन (ADH/वैसोप्रेसिन) मुख्य रूप से वृक्क के किस भाग पर कार्य करता है?","Distal convoluted tubule and collecting duct","Proximal convoluted tubule","Loop of Henle ascending limb","Glomerulus","दूरस्थ संवलित नलिका और संग्रह नलिका","समीपस्थ संवलित नलिका","हेनले लूप की आरोही भुजा","केशिकागुच्छ","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Distal convoluted tubule and collecting duct. यह जल का पुनरावशोषण बढ़ाकर मूत्र को सांद्र करता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The vasa recta helps to maintain -","वासा रेक्टा (Vasa recta) वृक्क में क्या बनाए रखने में सहायक है?","Blood pressure","Urea synthesis","The osmotic gradient in the medulla","Glomerular filtration","रक्तचाप","यूरिया संश्लेषण","मेडुला में परासरणी प्रवणता (Counter-current)","केशिकागुच्छ निस्यंदन","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — The osmotic gradient in the medulla. यह प्रतिधारा विनिमय तंत्र द्वारा सांद्रता प्रवणता बनाए रखती है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Saltatory conduction occurs in -","साल्टेटरी संवहन (Saltatory conduction) किसमें होता है?","Muscle fibres","Myelinated nerve fibres","Dendrites only","Non-myelinated fibres","पेशी तंतुओं में","माइलिनेटेड तंत्रिका तंतुओं में","केवल डेंड्राइट्स में","गैर-माइलिनेटेड तंतुओं में","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Myelinated nerve fibres. रैनवियर के नोड्स पर क्रिया विभव छलांग लगाते हुए तेजी से आगे बढ़ता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Oxytocin is released from the -","ऑक्सीटोसिन हार्मोन किस ग्रंथि से स्रावित/मुक्त होता है?","Posterior pituitary","Pineal gland","Adrenal cortex","Anterior pituitary","पश्च पीयूष ग्रंथि (Neurohypophysis)","पीनियल ग्रंथि","अधिवृक्क प्रांतस्था","अग्र पीयूष ग्रंथि","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Posterior pituitary. हाइपोथैलेमस में निर्मित होकर यह पश्च पीयूष से स्रावित होता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Calcium binds to ______ to initiate muscle contraction.","पेशी संकुचन प्रारंभ करने के लिए कैल्शियम आयन किससे जुड़ते हैं?","Tropomyosin","Myosin head","Actin","Troponin C","ट्रोपोमायोसिन","मायोसिन शीर्ष","एक्टिन","ट्रोपोनिन C (Troponin C)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Troponin C. Ca²⁺ के ट्रोपोनिन C से जुड़ने पर एक्टिन का सक्रिय स्थल खुल जाता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Secondary spermatocytes undergo meiosis II to form -","द्वितीयक शुक्राणु कोशिकाएँ अर्धसूत्री विभाजन-II के बाद क्या बनाती हैं?","Primary spermatocytes","Spermatogonia","Spermatozoa directly","Spermatids","प्राथमिक शुक्राणु कोशिकाएँ","शुक्राणुजन","सीधे शुक्राणु","स्पर्मेटिड (Spermatids)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Spermatids. स्पर्मेटिड्स बाद में स्पर्मियोजेनेसिस द्वारा शुक्राणु में रूपांतरित होते हैं।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The corpus luteum mainly secretes -","कॉर्पस ल्यूटियम मुख्य रूप से किस हार्मोन का स्राव करता है?","Oxytocin","FSH","Progesterone","LH","ऑक्सीटोसिन","एफएसएच","प्रोजेस्टेरोन (Progesterone)","एलएच","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Progesterone. यह गर्भावस्था के अनुरक्षण के लिए गर्भाशय की एंडोमेट्रियम को तैयार करता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Implantation occurs at the ______ stage of the embryo.","मानव भ्रूण का गर्भाशय में रोपण (Implantation) किस अवस्था में होता है?","Morula","Gastrula","Zygote","Blastocyst","मोरुला","गैस्ट्रुला","युग्मनज","ब्लास्टोसिस्ट (कोरकपुटी)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Blastocyst. निषेचन के लगभग 7वें दिन ब्लास्टोसिस्ट एंडोमेट्रियम में अंतःस्थापित होता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"hCG is secreted by the -","मानव कोरियोनिक गोनाडोट्रोपिन (hCG) किसके द्वारा स्रावित होता है?","Pituitary","Trophoblast/placenta","Ovary only","Corpus luteum only","पीयूष ग्रंथि","ट्रोफोब्लास्ट/अपरा (Placenta)","केवल अंडाशय","केवल कॉर्पस ल्यूटियम","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Trophoblast/placenta. गर्भावस्था परीक्षण किट मूत्र में hCG की उपस्थिति का पता लगाती है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Tubectomy is a method of -","ट्यूबेक्टोमी (Tubectomy) किसका एक उपाय है?","Female sterilisation","Male sterilisation","Hormonal contraception","Barrier contraception","महिला नसबंदी (शल्यक्रिया)","पुरुष नसबंदी","हार्मोनल गर्भनिरोधक","अवरोधक गर्भनिरोधक","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Female sterilisation. फैलोपियन नलिका को काटकर बांधना ट्यूबेक्टोमी कहलाता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The test cross ratio for a dihybrid (AaBb × aabb) is -","द्विसंकर परीक्षण संकरण (AaBb × aabb) का लक्षणप्ररूपी अनुपात क्या होता है?","9 : 3 : 3 : 1","3 : 1","1 : 2 : 1","1 : 1 : 1 : 1","9 : 3 : 3 : 1","3 : 1","1 : 2 : 1","1 : 1 : 1 : 1","D","Biology","Botany & Zoology","HARD",1,0,"Answer key: D — 1 : 1 : 1 : 1. स्वतंत्र अपव्यूहन की पुष्टि के लिए द्विसंकर टेस्ट क्रॉस अनुपात 1:1:1:1 होता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"In snapdragon (incomplete dominance), the F₂ phenotypic ratio is -","स्नैपड्रैगन में अपूर्ण प्रभाविता के कारण F₂ पीढ़ी का लक्षणप्ररूपी अनुपात क्या होता है?","1 : 1","1 : 2 : 1","3 : 1","9 : 3 : 3 : 1","1 : 1","1 लाल : 2 गुलाबी : 1 सफेद (1:2:1)","3 : 1","9 : 3 : 3 : 1","B","Biology","Botany & Zoology","HARD",1,0,"Answer key: B — 1 : 2 : 1. अपूर्ण प्रभाविता में जीनोटाइप और फीनोटाइप अनुपात दोनों 1:2:1 होते हैं।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The possible blood groups of children from IAi and IBi parents are -","IAi और IBi रक्त समूह वाले माता-पिता की संतानों में संभावित रक्त समूह कौन-से हो सकते हैं?","A, B, AB and O","O only","A and B only","AB only","A, B, AB और O चारों","केवल O","केवल A और B","केवल AB","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — A, B, AB and O. विषमयुग्मजी A और B माता-पिता से चारों रक्त समूह संभव हैं।","उत्तर A है।"
hp-tgt-medical-hptet,1,"A carrier mother and a normal father (haemophilia) will have ______ of sons affected.","वाहक माँ और सामान्य पिता होने पर कितने प्रतिशत पुत्रों के हीमोफिलिया से ग्रसित होने की संभावना है?","25%","50%","0%","100%","25%","50% पुत्र","0%","100%","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — 50%. XᴴXʰ × XᴴY में पुत्रों के जीनोटाइप XᴴY और XʰY (50% ग्रसित) होंगे।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The chromosomal constitution of Turner syndrome is -","टर्नर सिंड्रोम का गुणसूत्रीय संयोजन क्या होता है?","46, XY","47, XXY","45, XO","47, XXX","46, XY","47, XXY","45, XO (एक X गुणसूत्र की कमी)","47, XXX","C","Biology","Botany & Zoology","HARD",1,0,"Answer key: C — 45, XO. महिलाओं में एक X गुणसूत्र की अनुपस्थिति से टर्नर सिंड्रोम होता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The semi-conservative replication of DNA was demonstrated by -","डीएनए के अर्ध-संरक्षी प्रतिकृतियन को प्रायोगिक रूप से किसने सिद्ध किया था?","Hershey and Chase","Griffith","Meselson and Stahl","Avery","हर्षे और चेस","ग्रिफिथ","मेसल्सन और स्टाल (1958)","एवरी","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Meselson and Stahl. ई. कोलाई में ¹⁵N समस्थानिक का उपयोग कर सिद्ध किया।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The inducer of the lac operon is -","लैक ऑपेरॉन का प्रेरक (Inducer) कौन-सा अणु है?","Lactose permease","Repressor","Allolactose","β-galactosidase","लैक्टोज पर्मिएज","दमनकारी","एलोलैक्टोज (Allolactose)","बीटा-गैलेक्टोसिडेज","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Allolactose. एलोलैक्टोज रिप्रेशर प्रोटीन से जुड़कर उसे निष्क्रिय कर देता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The number of sense codons in the genetic code is -","आनुवंशिक कूट में अमीनो अम्लों को कोड करने वाले सार्थक कोडॉन (Sense codons) की संख्या कितनी है?","61","64","3","20","61 (कुल 64 में से 3 स्टॉप कोडॉन घटाकर)","64","3","20","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — 61. कुल 64 में से 3 समापन कोडॉन (UAA, UAG, UGA) को छोड़कर 61 सेंस कोडॉन हैं।","उत्तर A है।"
hp-tgt-medical-hptet,1,"In a population at Hardy–Weinberg equilibrium, q² = 0.04. The frequency of heterozygotes is -","हार्डी-वीनबर्ग साम्यावस्था में यदि अप्रभावी अलील आवृत्ति q² = 0.04 है, तो विषमयुग्मजी (2pq) की आवृत्ति क्या होगी?","0.64","0.16","0.08","0.32","0.64","0.16","0.08","0.32","D","Biology","Botany & Zoology","HARD",1,0,"Answer key: D — 0.32. q = √0.04 = 0.2; p = 1 - 0.2 = 0.8; 2pq = 2 × 0.8 × 0.2 = 0.32।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Industrial melanism in peppered moths is an example of -","पेपर्ड मॉथ में औद्योगिक मेलेनिनता (Industrial melanism) किसका प्रत्यक्ष उदाहरण है?","Mutation pressure only","Genetic drift","Artificial selection","Natural selection","केवल उत्परिवर्तन दबाव","आनुवंशिक विचलन","कृत्रिम चयन","प्राकृतिक चयन (दिशात्मक चयन)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Natural selection. प्रदूषण बढ़ने पर गहरे रंग के कीटों का जीवित रहना प्राकृतिक चयन का प्रमाण है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Forelimbs of whale and bat are examples of -","व्हेल और चमगादड़ के अग्रपाद किसके उदाहरण हैं?","Analogous organs","Vestigial organs","Convergent structures","Homologous organs","समवृत्ति अंग","अवशेषी अंग","अभिसारी संरचनाएँ","समजात अंग (Homologous organs)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Homologous organs. समान मूल उत्पत्ति और संरचना परंतु भिन्न कार्य वाले अंग समजात कहलाते हैं।","उत्तर D है।"
hp-tgt-medical-hptet,1,"EcoRI recognises the palindromic sequence -","प्रतिबंधन एंजाइम EcoRI किस विशिष्ट पैलिंड्रोमिक अनुक्रम की पहचान करता है?","GGATCC","CCCGGG","GAATTC","AAGCTT","5'-GGATCC-3'","5'-CCCGGG-3'","5'-GAATTC-3'","5'-AAGCTT-3'","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — GAATTC. EcoRI G और A के बीच कट लगाता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Taq polymerase is obtained from -","पीसीआर में प्रयुक्त टैक पॉलीमरेज़ एंजाइम किससे प्राप्त किया जाता है?","Thermus aquaticus","Escherichia coli","Agrobacterium tumefaciens","Bacillus thuringiensis","थर्मस एक्वाटिकस (तापरागी जीवाणु)","ई. कोलाई","एग्रोबैक्टीरियम","बैसिलस थुरिंजिएंसिस","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Thermus aquaticus. यह ताप-स्थिर डीएनए पॉलीमरेज़ उच्च तापमान पर भी सक्रिय रहता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"In gel electrophoresis, DNA fragments move towards the -","जेल इलेक्ट्रोफोरेसिस में ऋणावेशित डीएनए खंड किस इलेक्ट्रोड की ओर गति करते हैं?","Anode","Cathode","Both electrodes","Neither electrode","एनोड (+ धन ध्रुव) की ओर","कैथोड की ओर","दोनों की ओर","किसी ओर नहीं","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Anode. फॉस्फेट समूह के कारण डीएनए ऋणावेशित होकर धनात्मक एनोड की ओर बढ़ता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The pyramid of numbers in a tree ecosystem is -","एक एकल वृक्ष पारिस्थितिकी तंत्र में संख्याओं का पिरामिड कैसा होता है?","Inverted","Spindle-shaped","Absent","Upright","उल्टा (Inverted)","धुरी-नुमा","अनुपस्थित","सीधा","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Inverted. एक पेड़ पर कई शाकाहारी पक्षी और उन पर कई परजीवी निर्भर होते हैं।","उत्तर A है।"
hp-tgt-medical-hptet,1,"In the species–area relationship, the slope Z for small areas typically ranges between -","प्रजाति-क्षेत्र संबंध में लघु क्षेत्रों के लिए समाश्रयण गुणांक (Z का मान) सामान्यतः क्या होता है?","1 and 2","2 and 4","0.5 and 1","0.1 and 0.2","1 से 2","2 से 4","0.5 से 1","0.1 से 0.2","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — 0.1 and 0.2. अलेक्जेंडर वॉन हम्बोल्ट के अनुसार सामान्य क्षेत्रों में Z = 0.1 से 0.2 होता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The number of biodiversity hotspots currently represented in India is -","भारत में कुल कितने जैव विविधता हॉटस्पॉट विस्तृत हैं?","8","4","6","2","8","4 (हिमालय, इंडो-बर्मा, पश्चिमी घाट, सुंडालैंड)","6","2","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — 4. भारत में 4 वैश्विक जैव विविधता हॉटस्पॉट क्षेत्र आते हैं।","उत्तर B (4) है।"
hp-tgt-medical-hptet,1,"Leghaemoglobin in root nodules -","दालों की मूल ग्रंथियों में लेगहीमोग्लोबिन का मुख्य कार्य क्या है?","Fixes nitrogen","Transports sugars","Produces ATP","Protects nitrogenase from oxygen","नाइट्रोजन स्थिरीकरण","शर्करा परिवहन","एटीपी निर्माण","नाइट्रोजनेज एंजाइम को ऑक्सीजन से बचाना (Oxygen scavenger)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Protects nitrogenase from oxygen. नाइट्रोजनेज एंजाइम अवायवीय दशाओं में ही कार्य करता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The Widal test is used for the diagnosis of -","विडाल परीक्षण (Widal test) किसके निदान के लिए किया जाता है?","Typhoid","Tuberculosis","Malaria","AIDS","टाइफाइड (मियादी बुखार)","तपेदिक","मलेरिया","एड्स","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Typhoid. साल्मोनेला टाइफी संक्रमण की पहचान विडाल टेस्ट से होती है।","उत्तर A (Typhoid) है।"
hp-tgt-medical-hptet,1,"Interferons are -","इंटरफेरॉन (Interferons) क्या हैं?","Toxins","Antiviral proteins","Hormones","Antibacterial enzymes","विषाक्त पदार्थ","विषाणुरोधी प्रोटीन (Antiviral proteins)","हार्मोन","जीवाणुरोधी एंजाइम","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Antiviral proteins. वायरस-संक्रमित कोशिकाएँ गैर-संक्रमित कोशिकाओं की सुरक्षा के लिए इंटरफेरॉन छोड़ती हैं।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The radula is a feature of -","रेडुला (भोजन चबाने वाला अंग) किस संघ के जंतुओं की विशेषता है?","Echinodermata","Mollusca","Arthropoda","Annelida","इकाइनोडर्मेटा","मोलस्का (Mollusca)","आर्थ्रोपोडा","एनेलिडा","B","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: B — Mollusca. मोलस्क में रेती-नुमा जिव्हा (Radula) भोजन ग्रहण करने के काम आती है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The water vascular system is characteristic of -","जल संवहन तंत्र (Water vascular system) किस संघ का अद्वितीय लक्षण है?","Cnidaria","Mollusca","Echinodermata","Porifera","सीलेन्टरेटा","मोलस्का","इकाइनोडर्मेटा (Echinodermata)","पोरीफेरा","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Echinodermata. तारा मछली आदि में गमन और श्वसन जल संवहन तंत्र से होता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Which of the following has a four-chambered heart?","निम्नलिखित सरीसृपों में से किसमें पूर्णतः चार-कक्षीय हृदय पाया जाता है?","Lizard","Frog","Snake","Crocodile","छिपकली","मेंढक","साँप","मगरमच्छ (Crocodile)","D","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: D — Crocodile. मगरमच्छ सरीसृपों में अपवाद स्वरूप 4 कक्षीय हृदय वाला होता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The enzyme that unwinds DNA at the replication fork is -","डीएनए प्रतिकृतियन के समय हेलिक्स को खोलने वाला एंजाइम कौन-सा है?","Helicase","Primase","Ligase","Polymerase III","हेलीकेस (Helicase)","प्राइमेज","लाइगेज","डीएनए पॉलीमरेज़ III","A","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: A — Helicase. हेलीकेस हाइड्रोजन बंधों को तोड़कर प्रतिकृतियन द्विशाख बनाता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Which of the following is a plant growth inhibitor?","निम्नलिखित में से कौन-सा पादप वृद्धि संदमक (Inhibitor) हार्मोन है?","Gibberellin","Cytokinin","Abscisic acid","Auxin","जिबरेलिन","साइटोकाइनिन","एब्सिसिक एसिड (ABA)","ऑक्सिन","C","Biology","Botany & Zoology","MEDIUM",1,0,"Answer key: C — Abscisic acid. ABA वृद्धि को रोकने और प्रसुप्ति बनाए रखने का कार्य करता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Which of the following substances readily sublimes?","निम्नलिखित में से कौन-सा पदार्थ आसानी से ऊर्ध्वपातित (Sublimes) हो जाता है?","CaCl₂","NaCl","Naphthalene","KCl","कैल्शियम क्लोराइड","सोडियम क्लोराइड","नैफ्थलीन (कपूर/नैफ्थलीन)","पोटेशियम क्लोराइड","C","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: C — Naphthalene. नैफ्थलीन ठोस अवस्था से सीधे वाष्प में बदल जाती है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The number of unpaired electrons in Mn²⁺ is -","Mn²⁺ आयन (परमाणु क्रमांक 25) में अयुग्मित इलेक्ट्रॉनों की संख्या कितनी है?","4","3","6","5","4","3","6","5 (3d⁵)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — 5. Mn²⁺ का विन्यास [Ar] 3d⁵ है, जिसमें 5 अयुग्मित इलेक्ट्रॉन होते हैं।","उत्तर D (5) है।"
hp-tgt-medical-hptet,1,"The complex [Fe(CN)₆]⁴⁻ is -","संकुल आयन [Fe(CN)₆]⁴⁻ कैसा चुंबकीय व्यवहार दर्शाता है?","Paramagnetic with 4 unpaired electrons","Diamagnetic","Paramagnetic with 2 unpaired electrons","Paramagnetic with 6 unpaired electrons","4 अयुग्मित इलेक्ट्रॉनों के साथ अनुचुंबकीय","प्रतिचुंबकीय (Diamagnetic)","2 अयुग्मित इलेक्ट्रॉनों के साथ अनुचुंबकीय","6 अयुग्मित इलेक्ट्रॉनों के साथ अनुचुंबकीय","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — Diamagnetic. CN⁻ प्रबल लिगैंड है जो d-इलेक्ट्रॉनों का युग्मन कर देता है (d²sp³, 0 अयुग्मित)।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Which of the following is a neutral oxide?","निम्नलिखित में से कौन-सा उदासीन ऑक्साइड (Neutral Oxide) है?","N₂O","SnO₂","ZnO","SiO₂","नाइट्रस ऑक्साइड (N₂O)","टिन ऑक्साइड","जिंक ऑक्साइड","सिलिका","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — N₂O. CO, NO और N₂O उदासीन ऑक्साइड होते हैं।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Which of the following acids does NOT form an acidic salt?","निम्नलिखित में से कौन-सा अम्ल अम्लीय लवण नहीं बनाता है?","H₂SO₄","H₃PO₄","H₂CO₃","HCl","H₂SO₄","H₃PO₄","H₂CO₃","HCl (एकक्षारकीय अम्ल)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — HCl. एकक्षारकीय अम्ल होने के कारण HCl में केवल एक ही विस्थापन योग्य H⁺ होता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"A chelating ligand among the following is -","निम्नलिखित में से कौन-सा एक कीलेटिंग लिगैंड (Chelating ligand) है?","CN⁻","Cl⁻","NH₃","Ethylenediamine","साइनाइड आयन","क्लोराइड आयन","अमोनिया","एथिलीनडाइऐमीन (en)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — Ethylenediamine. यह द्विदंतुक लिगैंड धातु आयन के साथ वलय संरचना बनाता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The conjugate acid of NH₃ is -","अमोनिया (NH₃) का संयुग्मी अम्ल (Conjugate Acid) कौन-सा है?","NH₂⁻","NH₄⁺","NH₄OH","N₂H₄","NH₂⁻","अमोनियम आयन (NH₄⁺)","NH₄OH","N₂H₄","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — NH₄⁺. ब्रोंस्टेड सिद्धांत के अनुसार प्रोटॉन (H⁺) ग्रहण करने पर NH₄⁺ बनता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The oxidation number of Mn in KMnO₄ is -","पोटेशियम परमैंगनेट (KMnO₄) में मैंगनीज (Mn) की ऑक्सीकरण संख्या क्या है?","+4","+7","+2","+6","+4","+7","+2","+6","B","Chemistry","Chemistry","HARD",1,0,"Answer key: B — +7. (+1) + x + 4(-2) = 0 ⇒ x = +7।","उत्तर B (+7) है।"
hp-tgt-medical-hptet,1,"Bakelite is obtained by the reaction of phenol with -","बैकेलाइट फिनोल की किसके साथ अभिक्रिया से प्राप्त होता है?","HCHO","C₆H₅CHO","CH₃COCH₃","CH₃CHO","फॉर्मेल्डिहाइड (HCHO)","बेंजैल्डिहाइड","एसिटोन","एसिटैल्डिहाइड","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — HCHO. फिनोल और फॉर्मेल्डिहाइड के संघनन से ताप-दृढ़ बैकेलाइट बनता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Lucas reagent is -","ल्यूकास अभिकर्मक (Lucas reagent) किसका मिश्रण होता है?","Conc. HCl + HNO₃","Conc. H₂SO₄ + ZnCl₂","Conc. HNO₃ + anhydrous ZnCl₂","Conc. HCl + anhydrous ZnCl₂","सांद्र HCl + HNO₃","सांद्र H₂SO₄ + ZnCl₂","सांद्र HNO₃ + निर्जल ZnCl₂","सांद्र HCl + निर्जल ZnCl₂","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — Conc. HCl + anhydrous ZnCl₂. यह 1°, 2° और 3° ऐल्कोहॉलों में विभेद करने के काम आता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"A bacteriostatic antibiotic among the following is -","निम्नलिखित में से कौन-सा एक जीवाणुरोधी (Bacteriostatic) एंटीबायोटिक है?","Ofloxacin","Tetracycline","Aminoglycoside","Penicillin","ओफ़्लोक्सासिन","टेट्रासाइक्लिन (Tetracycline)","अमीनो ग्लाइकोसाइड","पेनिसिलिन","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — Tetracycline. टेट्रासाइक्लिन जीवाणुओं की वृद्धि को रोकता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The most acidic among the following hydroxides is -","निम्नलिखित हाइड्रॉक्साइडों में से सर्वाधिक अम्लीय कौन-सा है?","B(OH)₃","Be(OH)₂","Mg(OH)₂","Al(OH)₃","बोरिक अम्ल / B(OH)₃","Be(OH)₂","Mg(OH)₂","Al(OH)₃","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — B(OH)₃. H₃BO₃ एक दुर्बल ल्युइस अम्ल की तरह व्यवहार करता है।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The group-13 element that is liquid just above room temperature (m.p. about 30°C) is -","वर्ग-13 का वह तत्व जो कमरे के ताप से तनिक ऊपर (गलनांक ~30°C) द्रव अवस्था में आ जाता है?","Al","Ga","B","In","एल्युमिनियम","गैलियम (Ga)","बोरॉन","इंडियम","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — Ga. गैलियम गर्मियों में हथेली पर रखने से पिघल जाता है।","उत्तर B (Ga) है।"
hp-tgt-medical-hptet,1,"The electrophile in the nitration of benzene with HNO₃/H₂SO₄ is -","बेंजीन के नाइट्रीकरण (HNO₃/H₂SO₄) में सक्रिय इलेक्ट्रॉनस्नेही (Electrophile) कौन-सा है?","NO₂⁻","NO₃⁻","NO₂⁺","NO⁺","NO₂⁻","NO₃⁻","नाइट्रोनियम आयन (NO₂⁺)","NO⁺","C","Chemistry","Chemistry","HARD",1,0,"Answer key: C — NO₂⁺. H₂SO₄ और HNO₃ की क्रिया से NO₂⁺ बनता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"Which of the following gives the iodoform test?","निम्नलिखित में से कौन-सा यौगिक आयोडोफॉर्म परीक्षण (Iodoform test) देता है?","CH₃CH₂CHO","CH₃COCH₃","HCHO","C₆H₅CHO","प्रोपैनेल","एसिटोन (CH₃COCH₃)","फॉर्मेल्डिहाइड","बेंजैल्डिहाइड","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — CH₃COCH₃. CH₃-C=O समूह वाले यौगिक पीले रंग का CHI₃ अवक्षेप देते हैं।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The enzyme that converts glucose into ethanol is -","ग्लूकोज को एथिल अल्कोहल में परिवर्तित करने वाला एंजाइम कौन-सा है?","Invertase","Zymase","Maltase","Pepsin","इनवर्टेज","जाइमेज (Zymase)","माल्टेज","पेप्सिन","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — Zymase. यीस्ट में उपस्थित जाइमेज किण्वन द्वारा एथेनॉल बनाता है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Which of the following does NOT show the Tyndall effect?","निम्नलिखित में से कौन-सा टिंडल प्रभाव प्रदर्शित नहीं करता है?","Sugar solution","Milk","Soap solution","Starch solution","शर्करा का वास्तविक विलयन","दूध","साबुन का घोल","स्टार्च का घोल","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — Sugar solution. वास्तविक विलयन में कण बहुत छोटे होने से टिंडल प्रभाव नहीं दिखाते।","उत्तर A है।"
hp-tgt-medical-hptet,1,"Given ΔcH (CH₄) = −890.3, ΔcH (C) = −393.5 and ΔcH (H₂) = −285.8 kJ/mol, the ΔfH of CH₄ is -","CH₄ के निर्माण की मानक एन्थैल्पी (ΔfH) क्या होगी?","−52.3 kJ/mol","−74.8 kJ/mol","+52.3 kJ/mol","+74.8 kJ/mol","−52.3 kJ/mol","−74.8 kJ/mol","+52.3 kJ/mol","+74.8 kJ/mol","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — −74.8 kJ/mol. ΔfH = ΔcH(C) + 2ΔcH(H₂) - ΔcH(CH₄) = -393.5 - 571.6 + 890.3 = -74.8 kJ/mol।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Given C + O₂ → CO₂ (−393.5 kJ) and CO + ½O₂ → CO₂ (−283 kJ), ΔH for C + ½O₂ → CO is -","कार्बन मोनोऑक्साइड के निर्माण की एन्थैल्पी (ΔH) क्या होगी?","−283 kJ","−110.5 kJ","+110.5 kJ","−676.5 kJ","−283 kJ","−110.5 kJ","+110.5 kJ","−676.5 kJ","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — −110.5 kJ. -393.5 - (-283.0) = -110.5 kJ।","उत्तर B है।"
hp-tgt-medical-hptet,1,"The pH of 0.01 M HCl is -","0.01 M हाइड्रोक्लोरिक अम्ल (HCl) के जलीय विलयन का pH मान क्या होगा?","0.01","2","12","1","0.01","2 (-log[10⁻²])","12","1","B","Chemistry","Chemistry","HARD",1,0,"Answer key: B — 2. pH = -log[H⁺] = -log(0.01) = 2।","उत्तर B है।"
hp-tgt-medical-hptet,1,"For a first-order reaction with k = 0.0693 min⁻¹, the half-life is -","प्रथम कोटि अभिक्रिया (k = 0.0693 min⁻¹) का अर्धायु काल (t₁/₂) क्या होगा?","100 min","1 min","0.693 min","10 min","100 मिनट","1 मिनट","0.693 मिनट","10 मिनट (0.693/0.0693)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — 10 min. t₁/₂ = 0.693 / k = 0.693 / 0.0693 = 10 min।","उत्तर D है।"
hp-tgt-medical-hptet,1,"The number of radial nodes in a 4s orbital is -","4s कक्षक में त्रिज्य नोडों (Radial nodes) की संख्या कितनी होती है?","3","1","4","0","3 (n - l - 1 = 4 - 0 - 1)","1","4","0","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — 3. Radial nodes = n - l - 1 = 4 - 0 - 1 = 3।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The hybridisation of sulphur in SF₆ is -","सल्फर हेक्साफ्लोराइड (SF₆) में सल्फर का संकरण क्या होता है?","sp³d","sp²","sp³d²","sp³","sp³d","sp²","sp³d² (अष्टफलकीय)","sp³","C","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: C — sp³d². 6 सिग्मा बंधों के कारण sp³d² संकरण और अष्टफलकीय ज्यामिति होती है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The bond order of CO is -","कार्बन मोनोऑक्साइड (CO) अणु का बंध क्रम (Bond Order) क्या है?","3","2","1","2.5","3 (14 इलेक्ट्रॉन)","2","1","2.5","A","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: A — 3. CO में कुल 14 इलेक्ट्रॉन होते हैं, बॉन्ड ऑर्डर = (10 - 4)/2 = 3।","उत्तर A है।"
hp-tgt-medical-hptet,1,"The IUPAC name of CH₃CH(OH)CH₂CH₃ is -","CH₃CH(OH)CH₂CH₃ का IUPAC नाम क्या है?","Butanal","Butan-1-ol","2-Methylpropan-1-ol","Butan-2-ol","ब्यूटेनेल","ब्यूटेन-1-ऑल","2-मेथिलप्रोपेन-1-ऑल","ब्यूटेन-2-ऑल (Butan-2-ol)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — Butan-2-ol. 4 कार्बन की शृंखला में स्थिति 2 पर -OH समूह है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Solubility of AgCl is lowest in -","समान आयन प्रभाव के कारण AgCl की विलेयता किसमें सबसे कम होगी?","0.01 M KNO₃","0.1 M NaCl","Pure water","0.1 M NaNO₃","0.01 M KNO₃","0.1 M NaCl (अधिकतम Cl⁻ आयन)","शुद्ध जल","0.1 M NaNO₃","B","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: B — 0.1 M NaCl. Cl⁻ आयनों की उच्च सांद्रता से विलेयता घट जाती है।","उत्तर B है।"
hp-tgt-medical-hptet,1,"Which of the following is a strong electrolyte?","निम्नलिखित में से कौन-सा प्रबल विद्युत-अपघट्य (Strong Electrolyte) है?","Glucose","Ammonium hydroxide","NaCl","Acetic acid","ग्लूकोज","अमोनियम हाइड्रॉक्साइड","सोडियम क्लोराइड (NaCl)","एसिटिक एसिड","C","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: C — NaCl. NaCl जलीय विलयन में पूर्णतः आयनित हो जाता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The shape of the XeF₂ molecule is -","जीनॉन डाइफ्लोराइड (XeF₂) अणु की ज्यामिति कैसी होती है?","Tetrahedral","T-shaped","Linear","Bent","चतुष्फलकीय","T-आकार","रैखिक (Linear)","मुड़ी हुई","C","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: C — Linear. 2 बंध और 3 एकाकी युग्म होने से अणु रैखिक आकार लेता है।","उत्तर C है।"
hp-tgt-medical-hptet,1,"The monomer of Nylon-6 is -","नायलॉन-6 का एकलक (Monomer) कौन-सा है?","Phenol","Hexamethylenediamine","Adipic acid","Caprolactam","फिनोल","हेक्सामेथिलीन डाइऐमीन","एडिपिक एसिड","कैप्रोलैक्टम (Caprolactam)","D","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: D — Caprolactam. कैप्रोलैक्टम के रिंग-ओपनिंग बहुलकीकरण से नायलॉन-6 बनता है।","उत्तर D है।"
hp-tgt-medical-hptet,1,"Aspirin is chemically -","एस्पिरिन (Aspirin) का रासायनिक नाम क्या है?","Paracetamol","Salicylaldehyde","Acetylsalicylic acid","Methyl salicylate","पैरासिटामोल","सैलिसिलैल्डिहाइड","एसिटाइल सैलिसिलिक एसिड","मेथिल सैलिसिलेट","C","Chemistry","Chemistry","MEDIUM",1,0,"Answer key: C — Acetylsalicylic acid. सैलिसिलिक एसिड के एसिटिलीकरण से एस्पिरिन बनती है।","उत्तर C है।"`;

// Save all Mock CSVs from the blocks user provided
const DATA_DIR = path.join(__dirname, '../data/hptet-medical');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// RFC-4180 CSV Parser
function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const rows = [];
  let currentRow = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const next = clean[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        currentRow.push(cur.trim());
        cur = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') i++;
        currentRow.push(cur.trim());
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
        currentRow = [];
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  if (cur.length > 0 || currentRow.length > 0) {
    currentRow.push(cur.trim());
    if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s-]+/g, '_').trim());
  return rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    return obj;
  });
}

async function uploadMockRows(rows, mockNumber) {
  console.log(`\n========================================`);
  console.log(`Processing Mock Test #${mockNumber} (${rows.length} questions)...`);
  console.log(`========================================`);

  // 1. Ensure Exam exists
  let exam = await prisma.exam.findUnique({
    where: { slug: 'hp-tet-tgt-medical' },
  });

  if (!exam) {
    console.log('Creating Exam: HP TET TGT Medical 2026...');
    exam = await prisma.exam.create({
      data: {
        id: 'exam-hp-tet-tgt-medical',
        name: 'HP TET TGT Medical 2026',
        nameHi: 'एचपी टीईटी टीजीटी मेडिकल 2026',
        slug: 'hp-tet-tgt-medical',
        description: 'Comprehensive bilingual test series for HP TET TGT Medical examination as per official syllabus.',
        descriptionHi: 'नवीनतम आधिकारिक पाठ्यक्रम के अनुसार एचपी टीईटी टीजीटी मेडिकल परीक्षा के लिए द्विभाषी मॉक टेस्ट सीरीज़।',
        totalQuestions: 150,
        durationMinutes: 150,
        difficulty: 'MEDIUM',
        price: 1,
        category: 'HP TET Exams',
        negativeMarking: 0,
        marksPerQuestion: 1,
      },
    });
  }

  // 2. Ensure Mock Test exists
  let mockTest = await prisma.mockTest.findUnique({
    where: {
      examId_testNumber: {
        examId: exam.id,
        testNumber: mockNumber,
      },
    },
  });

  if (!mockTest) {
    console.log(`Creating MockTest #${mockNumber}...`);
    mockTest = await prisma.mockTest.create({
      data: {
        id: `hp-tet-tgt-medical-mock-${mockNumber}`,
        examId: exam.id,
        testNumber: mockNumber,
        name: `HP TET TGT Medical Mock Test ${mockNumber}`,
        isFree: mockNumber === 1,
        isPublished: true,
        totalQuestions: rows.length,
        durationMinutes: 150,
        totalMarks: rows.length,
        marksPerQuestion: 1,
        negativeMarksPerQuestion: 0,
      },
    });
  } else {
    await prisma.mockTest.update({
      where: { id: mockTest.id },
      data: {
        isPublished: true,
        totalQuestions: rows.length,
        totalMarks: rows.length,
      },
    });
  }

  // 3. Cache subjects and topics
  const dbSubjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    include: { topics: true },
  });
  const subjectMap = new Map();
  dbSubjects.forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s));

  // 4. Fetch existing questions to update rather than duplicate
  const existingQuestions = await prisma.question.findMany({
    where: { mockTestId: mockTest.id },
    select: { id: true, questionNumber: true, questionText: true },
  });
  const qByNumber = new Map();
  const qByText = new Map();
  existingQuestions.forEach((q) => {
    qByNumber.set(q.questionNumber, q);
    qByText.set(q.questionText.trim().toLowerCase(), q);
  });

  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const qNum = i + 1;

    // Resolve subject
    const subjName = (r.subject || 'Child Development & Pedagogy').trim();
    const subjKey = subjName.toLowerCase();
    let subject = subjectMap.get(subjKey);

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          examId: exam.id,
          name: subjName,
          nameHi: subjName,
        },
        include: { topics: true },
      });
      subjectMap.set(subjKey, subject);
    }

    // Resolve topic
    const topicName = (r.topic || 'General').trim();
    const topicKey = topicName.toLowerCase();
    let topic = (subject.topics || []).find((t) => t.name.toLowerCase().trim() === topicKey);

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          subjectId: subject.id,
          name: topicName,
          nameHi: topicName,
        },
      });
      if (!subject.topics) subject.topics = [];
      subject.topics.push(topic);
    }

    const qText = r.question || r.hindi_question || '';
    const qTextHi = r.hindi_question || r.question || '';
    const normText = qText.trim().toLowerCase();

    // Check if question exists
    let existingQ = qByText.get(normText) || qByNumber.get(qNum);

    const questionData = {
      mockTestId: mockTest.id,
      subjectId: subject.id,
      topicId: topic.id,
      questionNumber: qNum,
      questionText: qText,
      questionTextHi: qTextHi,
      correctOption: r.correct_answer.toUpperCase().trim(),
      marks: Number(r.marks) || 1.0,
      negativeMarks: Number(r.negative_marks) || 0,
      difficulty: (r.difficulty || 'MEDIUM').toUpperCase().trim(),
      explanation: r.explanation || '',
      explanationHi: r.hindi_explanation || r.explanation || '',
    };

    if (existingQ) {
      // Update
      await prisma.question.update({
        where: { id: existingQ.id },
        data: {
          ...questionData,
          options: {
            deleteMany: {},
            create: [
              { optionLabel: 'A', optionText: r.option_a || '', optionTextHi: r.hindi_option_a || r.option_a || '' },
              { optionLabel: 'B', optionText: r.option_b || '', optionTextHi: r.hindi_option_b || r.option_b || '' },
              { optionLabel: 'C', optionText: r.option_c || '', optionTextHi: r.hindi_option_c || r.option_c || '' },
              { optionLabel: 'D', optionText: r.option_d || '', optionTextHi: r.hindi_option_d || r.option_d || '' },
            ],
          },
        },
      });
      updated++;
    } else {
      // Create
      const newQ = await prisma.question.create({
        data: {
          ...questionData,
          options: {
            create: [
              { optionLabel: 'A', optionText: r.option_a || '', optionTextHi: r.hindi_option_a || r.option_a || '' },
              { optionLabel: 'B', optionText: r.option_b || '', optionTextHi: r.hindi_option_b || r.option_b || '' },
              { optionLabel: 'C', optionText: r.option_c || '', optionTextHi: r.hindi_option_c || r.option_c || '' },
              { optionLabel: 'D', optionText: r.option_d || '', optionTextHi: r.hindi_option_d || r.option_d || '' },
            ],
          },
        },
      });
      qByNumber.set(qNum, newQ);
      qByText.set(normText, newQ);
      created++;
    }
  }

  console.log(`Mock #${mockNumber} completed: ${created} created, ${updated} updated.`);
}

async function main() {
  console.log('Connecting to database:', DB_URL);
  
  // Read all CSV files from data/hptet-medical
  const files = [
    { num: 1, file: 'hptet-tgt-medical-mock-1.csv' },
    { num: 2, file: 'hptet-tgt-medical-mock-2.csv' },
    { num: 3, file: 'hptet-tgt-medical-mock-3.csv' },
    { num: 4, file: 'hptet-tgt-medical-mock-4.csv' },
    { num: 5, file: 'hptet-tgt-medical-mock-5.csv' },
  ];

  for (const item of files) {
    const filePath = path.join(DATA_DIR, item.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const rows = parseCsv(content);
      await uploadMockRows(rows, item.num);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  // Summary
  const count = await prisma.question.count({
    where: { mockTest: { exam: { slug: 'hp-tet-tgt-medical' } } }
  });
  console.log(`\n🎉 ALL HPTET TGT MEDICAL QUESTIONS UPLOADED SUCCESSFULLY! Total in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error('Upload failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
