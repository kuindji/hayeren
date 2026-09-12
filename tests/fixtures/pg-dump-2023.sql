COPY public.article (id, case_id, language, title, text, "position") FROM stdin;
7ba5487e-8ae1-4170-bce4-bd8861897356	possessive	russian	Применение	-- для обозначения принадлежности\n\n-- когда вы идете на какую-то активность \n\n\n> Գնում եմ աշխատանք**ի** (_иду на работу_)\n\n> Գնում եմ դաս**ի** (_иду на урок_)\n\n> Գնում եմ քեֆ**ի** (_иду на вечеринку_)\n\n> Գնում եմ հանդիպմ**ան** (_иду на встречу_)\n\n-- с вопросами приведенными ниже 	1
de136926-4610-4c15-8b9c-eacb269da002	dative	russian	Форма слов	-- Для одушевленных существительных:\n\nСлово в _притяжательном_ падеже + _определенный артикль_ (**ը** или **ն**)\n\nտեսնում եմ ընկերոջ**ը** (_вижу друга_)\n\n-- Для неодушевленных существительных:\n\nСлово в _именительном_ падеже + _определенный артикль_ (**ը** или **ն**)\n\nտեսնում եմ աթոռ**ը** (_вижу стул_)	0
332449b5-9257-4dcf-867d-27735bb88c26	possessive	russian	Форма слов	Для _субъектов_ (то есть, для того, _чему_ что-то принадлежит) в большинстве случаев притяжательный падеж выражается добавлением к слову окончания **ի**. \n\nսեղան**ի** գույն**ը** (_цвет стола_)\n\nДля _объектов_ (то есть, для того, _что_ принадлежит) притяжательный падеж выражается с помощью притяжательного артикля **ը**. (Кроме тех случаев, когда обозначается движение в сторону объекта - Գնում եմ իմ տուն)\n\nПри использовании с местоимениями **Իմ** (_мой_) и **քո** (_твой_) сами местоимения часто опускаются, а притяжательный артикль заменяется на **ս** и **դ** соответственно.\n\nիմ գիրք**ը** (_моя книга_)\nգիրք**ս** (_моя книга_)\n\nքո գիրք**ը** (_твоя книга_)\nգիրք**դ** (_твоя книга_)	0
\.
COPY public."case" (id, name, description, "position") FROM stdin;
nominative	{"russian": "Именительный падеж"}	{}	0
ablative	{"russian": "Исхо́дный падеж"}	{}	3
locative	{"russian": "Местный падеж"}	{}	5
instrumental	{"russian": "Творительный падеж"}	{"russian": ""}	4
dative	{"english": "", "russian": "Дательный падеж"}	{"english": "", "russian": "Выражает действие, направленное к предмету."}	2
possessive	{"english": "", "russian": "Родительный падеж"}	{"english": "", "russian": "Родительный падеж чаще всего выражает принадлежность предмета."}	1
\.
COPY public.case_noun_group (id, case_id, name, comment, description, declension_id) FROM stdin;
5d5d9f71-3c8d-413c-a3c9-b343b500a86d	possessive	{"egnlish": "", "russian": "Все существительные с суффиксом ություն"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	\N
e3a8dda6-d2e0-4025-88f5-dc29953187a3	possessive	{"egnlish": "", "russian": "Слова заканчивающиеся на ի"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	ու
762389cc-26f4-43f4-aa37-2272f159e626	possessive	{"egnlish": "", "russian": "Следующие пять слов"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	ու
928ca7bf-3ada-49a7-b10c-413d3061d2d5	possessive	{"egnlish": "", "russian": "Односложные слова с неправильной формой множественного числа"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	ան
696bc341-3af3-4e43-8a8d-9656c0e14c4a	possessive	{"egnlish": "", "russian": "Исключения"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	վա
39336022-7b7e-415a-bf09-1bfe6c5a65fe	possessive	{"egnlish": "", "russian": "Исключения"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	\N
0be99908-9fe7-420a-99bf-cec362bc2750	possessive	{"egnlish": "", "russian": "Слова заканчивающиеся на -ում"}	{"egnlish": "", "russian": ""}	{"egnlish": "", "russian": ""}	\N
\.
COPY public.case_noun_group_noun (id, noun_id, case_noun_group_id) FROM stdin;
7dc22d7a-5032-4082-ac39-7065f680d9af	history	5d5d9f71-3c8d-413c-a3c9-b343b500a86d
c4a9d599-7aa8-4fac-8efc-c92213367de3	wine	e3a8dda6-d2e0-4025-88f5-dc29953187a3
15d0387c-66e9-425a-87d4-66656cafb1f0	enemy	e3a8dda6-d2e0-4025-88f5-dc29953187a3
f6c0b7aa-58b8-4d7f-9eae-26744d818e21	wind	e3a8dda6-d2e0-4025-88f5-dc29953187a3
3f123aa3-d467-487c-8725-5e6e891f7bd9	uncle-mother	e3a8dda6-d2e0-4025-88f5-dc29953187a3
59f65594-9264-46d2-b8ed-56fb3d5c2efd	villager	e3a8dda6-d2e0-4025-88f5-dc29953187a3
049dbde9-9d14-4bc9-9550-2999b3d6140e	man	762389cc-26f4-43f4-aa37-2272f159e626
1dc22467-be8d-402e-adc7-1547d5a93c5a	husband	762389cc-26f4-43f4-aa37-2272f159e626
38f49959-382a-470b-b60d-52b3e03d4468	horse	762389cc-26f4-43f4-aa37-2272f159e626
39d58f8b-ab1c-4014-82a7-330f8f320670	god	762389cc-26f4-43f4-aa37-2272f159e626
958d67fc-2eb0-491a-97f0-f079d5165409	door	928ca7bf-3ada-49a7-b10c-413d3061d2d5
74129867-7cd9-4822-9af4-c08481179842	rock-mountain	928ca7bf-3ada-49a7-b10c-413d3061d2d5
cd0431ad-faac-4fc0-8a52-f72b1998bad0	fish	928ca7bf-3ada-49a7-b10c-413d3061d2d5
27738186-609c-4681-bb18-149eabd35a5b	mouse	928ca7bf-3ada-49a7-b10c-413d3061d2d5
1df2c2f6-5253-4490-bd18-6eda5c3617ae	pomegranate	928ca7bf-3ada-49a7-b10c-413d3061d2d5
a69d42d6-cf1d-4f38-82c5-f151f21ab759	grandchild	928ca7bf-3ada-49a7-b10c-413d3061d2d5
f8a9a95d-fbc5-490d-aac4-f5ba4efa6044	minute	696bc341-3af3-4e43-8a8d-9656c0e14c4a
4d2320cc-a544-4b5a-9243-9b65c30d6890	second	696bc341-3af3-4e43-8a8d-9656c0e14c4a
160b895c-e5c1-4972-b6ee-f499dbce8a3d	century	696bc341-3af3-4e43-8a8d-9656c0e14c4a
a514749c-6639-4133-9743-65586a006e4a	evening	696bc341-3af3-4e43-8a8d-9656c0e14c4a
fac93174-30c9-4944-ae12-600ab812ce3f	girl	39336022-7b7e-415a-bf09-1bfe6c5a65fe
5990312e-5052-4ab1-a9d2-a8c25b65a392	love	39336022-7b7e-415a-bf09-1bfe6c5a65fe
0bc28834-bb3c-4ea2-814d-9df540e47673	meeting	0be99908-9fe7-420a-99bf-cec362bc2750
\.
COPY public.case_question (id, type, prepostposition_id, question, comment, case_id) FROM stdin;
2896ade8-efa0-4820-8961-dbd345276e38	noun	\N	{"egnlish": "", "russian": "чегó"}	{"egnlish": "", "russian": ""}	possessive
f8e72d9d-ef32-4bc2-8f52-ee1211fbf263	noun	for	{"egnlish": "", "russian": "для чегó"}	{"egnlish": "", "russian": ""}	possessive
784e632d-2579-4d92-ac69-e765a93ca55e	noun	about	{"egnlish": "", "russian": "про что"}	{"egnlish": "", "russian": ""}	possessive
1c4a9a1f-ec74-49c3-b233-b9da29765a21	\N	\N	{"egnlish": "", "russian": "кто"}	{"egnlish": "", "russian": ""}	nominative
4afa8230-b764-439a-a376-4c3b7e7b72f3	\N	\N	{"egnlish": "", "russian": "что"}	{"egnlish": "", "russian": ""}	nominative
363ffaeb-2a00-4c79-949a-17524ad4cdc5	noun	at	{"egnlish": "", "russian": "у чегó"}	{"egnlish": "", "russian": ""}	possessive
175fdfb5-35a5-44d9-b3b3-6735eaa5a044	noun	on	{"egnlish": "", "russian": "на чем"}	{"egnlish": "", "russian": ""}	possessive
ecf47ab5-0d4d-427c-a526-f4b32b0a0049	noun	instead	{"egnlish": "", "russian": "вместо чегó"}	{"egnlish": "", "russian": ""}	possessive
b4bc49be-d048-4037-92a6-7c3637961a53	noun	in	{"egnlish": "", "russian": "в чем"}	{"egnlish": "", "russian": ""}	possessive
f12ae56c-d1f1-4f5b-b5bc-5a8750edea9c	noun	between	{"egnlish": "", "russian": "между чем"}	{"egnlish": "", "russian": ""}	possessive
898fb51f-6b81-41ab-baa1-afbac7158937	noun	under	{"egnlish": "", "russian": "под чем"}	{"egnlish": "", "russian": ""}	possessive
eaa7cc2c-d1ca-49e4-93bc-9dea30cbd54c	noun	before	{"egnlish": "", "russian": "перед чем"}	{"egnlish": "", "russian": "в контексте места"}	possessive
dc7a25aa-77b6-400e-8a30-215e173033e7	pronoun	about	{"egnlish": "", "russian": "про когó"}	{"egnlish": "", "russian": ""}	possessive
bfadb801-ec05-4cea-9352-73b145b1e10a	pronoun	instead	{"egnlish": "", "russian": "вместо когó"}	{"egnlish": "", "russian": ""}	possessive
f7fa09e5-0e57-4890-84b2-45e49bee3345	pronoun	under	{"egnlish": "", "russian": "под кем"}	{"egnlish": "", "russian": ""}	possessive
475467e1-e280-4ad9-a2ab-e323fa8fbe89	pronoun	in	{"egnlish": "", "russian": "в ком"}	{"egnlish": "", "russian": ""}	possessive
6ae4843e-6c2f-446c-a18f-807eeb1bfd8e	pronoun	between	{"egnlish": "", "russian": "между кем"}	{"egnlish": "", "russian": ""}	possessive
86f01147-aab2-45cf-baab-d9fa9615088f	noun	with	{"egnlish": "", "english": "", "russian": "с чем"}	{"egnlish": "", "russian": "чаще для одушевленных"}	possessive
aeb71afe-579e-40d3-8ac1-6f4b2bdf80d0	noun	through	{"egnlish": "", "russian": "через что/по чему"}	{"egnlish": "", "russian": ""}	possessive
aea1f8cf-aa48-4179-a749-bc82685e770c	noun	because-of	{"egnlish": "", "russian": "из-за чего"}	{"egnlish": "", "russian": ""}	possessive
fbd52cab-445d-4c98-9507-67855c2dad5a	pronoun	because-of	{"egnlish": "", "russian": "из-за кого"}	{"egnlish": "", "russian": ""}	possessive
374717d9-4dab-40ed-8e2c-32925957a226	noun	like	{"egnlish": "", "russian": "как что"}	{"egnlish": "", "russian": ""}	possessive
3d2d30f4-e74a-481a-9039-c3002de83903	pronoun	like	{"egnlish": "", "russian": "как кто"}	{"egnlish": "", "russian": ""}	possessive
968b3714-106a-4643-889e-d57ae0ecc7a8	pronoun	\N	{"egnlish": "", "russian": "чей"}	{"egnlish": "", "russian": ""}	possessive
\.
COPY public.declension (id, name, description, comment) FROM stdin;
ոջ	{"russian": "ոջ-склонение"}	{}	{"russian": "Применяется в единственном числе"}
ա	{"russian": "ա-склонение"}	{}	{"russian": "Применяется в единственном числе"}
ու	{"russian": "ու-склонение"}	{}	{"russian": "Применяется в единственном числе"}
ո	{"russian": "ո-склонение"}	{}	{"russian": "Применяется в единственном числе"}
ան	{"russian": "ան-склонение"}	{}	{"russian": "Применяется в единственном числе"}
ց	{"russian": "ց-склонение"}	{}	{"russian": "Применяется в единственном числе"}
վա	{"russian": "վա-склонение"}	{}	{"russian": "Для обозначений времени. Применяется в единственном числе"}
\.
COPY public.noun (id, comment, description) FROM stdin;
table	{}	{}
wine	{}	{}
woman	{}	{}
history	{"english": "", "russian": ""}	{"english": "", "russian": ""}
home	{"russian": "в значении места"}	{}
friend	{}	{}
sister	{}	{}
owner	{}	{}
dog	{}	{}
snow	{}	{}
blood	{}	{}
angle	{}	{}
enemy	{}	{}
wind	{}	{}
uncle-mother	{"russian": "со стороны матери"}	{}
villager	{}	{}
man	{}	{}
husband	{}	{}
horse	{}	{}
god	{}	{}
father	{}	{}
mother	{}	{}
brother	{}	{}
summer	{}	{}
autumn	{}	{}
winter	{}	{}
spring	{}	{}
door	{}	{}
rock-mountain	{}	{}
fish	{}	{}
mouse	{}	{}
pomegranate	{}	{}
grandchild	{}	{}
day	{}	{}
month	{}	{}
morning	{}	{}
yesterday	{}	{}
tomorrow	{}	{}
day-time	{"russian": "время дня"}	{}
year	{}	{}
minute	{}	{}
second	{}	{}
century	{}	{}
evening	{}	{}
we-group	{"russian": "как общность"}	{}
you-group	{"russian": "как общность"}	{}
girl	{}	{}
love	{}	{}
meeting	{}	{}
tunnel	{}	{}
\.
COPY public.noun_case (id, noun_id, case_id, single, plural, declension_id, comment) FROM stdin;
dd1e4114-b425-437a-8e9a-6ce566a2ee4f	owner	nominative	{"russian": "владелец", "armenian": "տեր", "transcription": "ter"}	{"russian": "владельцы", "armenian": "տերեր", "transcription": "terer"}	\N	{}
42e1e4c0-5e0b-469e-bc80-744e18e48458	table	possessive	{"comment": {"english": "", "russian": ""}, "russian": "стола́", "armenian": "սեղան*ի*", "transcription": "seghaní"}	{"comment": {"english": "", "russian": ""}, "russian": "столóв", "armenian": "սեղաններ*ի*", "transcription": "seghannerí"}	\N	{}
4c153a1f-4728-422f-b50c-7e192a6305a9	wine	nominative	{"russian": "винó", "armenian": "գինի", "transcription": "giní"}	{"russian": "ви́на", "armenian": "գինիներ", "transcription": "gininér"}	\N	{}
63067254-5301-418a-ad86-4837c982226e	wine	possessive	{"russian": "вина́", "armenian": "գինու", "transcription": "ginú"}	{"russian": "ви́н", "armenian": "գինիներ*ի*", "transcription": "gininerí"}	ու	{}
e4178ac7-0557-4b40-a9da-cb4978eb8809	woman	nominative	{"russian": "жéнщина, жена́", "armenian": "կին", "transcription": "kin"}	{"russian": "жéнщины, жéны", "armenian": "կան*այք*", "transcription": "kanáyk"}	\N	{}
bf0aef31-003f-4d75-a0ae-3451fbd02705	sister	possessive	{"russian": "сестры́", "armenian": "քր*ոջ*", "transcription": "k'roch"}	{"russian": "сестéр", "armenian": "քույրեր*ի*", "transcription": "k'uireri"}	ոջ	{}
7702d1e6-d53e-4925-8206-9712ad196e06	home	nominative	{"russian": "дом", "armenian": "տուն", "transcription": "tun"}	{"russian": "дома́", "armenian": "տներ", "transcription": "tnér"}	\N	{}
e9cdea6a-e530-4858-825f-55946b4149e0	history	nominative	{"russian": "истóрия", "armenian": "պատմություն", "transcription": "patmut'yún"}	{}	\N	{}
7d55cec0-928b-4648-9eb2-cd7d7e161967	history	possessive	{"russian": "истóрии", "armenian": "պատմության", "transcription": "patmut'yán"}	{}	\N	{}
af55e035-094c-4678-9869-4e3a8377500e	dog	possessive	{"russian": "собаки", "armenian": "շ*ա*ն", "transcription": "shan"}	{"russian": "собак", "armenian": "շներ*ի*", "transcription": "shneri"}	ա	{}
ad906990-6533-4b78-a933-86cff55c67f9	table	nominative	{"comment": {"english": "", "russian": ""}, "english": "", "russian": "стол", "armenian": "սեղան", "informal": "", "transcription": "seghán"}	{"comment": {"english": "", "russian": ""}, "english": "", "russian": "столы́", "armenian": "սեղաններ", "transcription": "seghannér"}	\N	{}
df4c67fd-189b-4308-a5b0-db888829f9a3	table	dative	{"russian": "стол", "armenian": "սեղան*ին*", "transcription": "seghanín"}	{"russian": "столы́", "armenian": "սեղաններ*ին*", "transcription": "seghannerín"}	\N	{}
028d6a0b-5234-4099-b69c-3e841d19e4b2	table	ablative	{"russian": "стола́", "armenian": "սեղան*ից*", "transcription": "seghaníts"}	{"russian": "столóв", "armenian": "սեղաններ*ից*", "transcription": "seghanneríts"}	\N	{}
3caedcfb-659b-41bd-a6d8-3960ce984f18	table	locative	{"russian": "столé", "armenian": "սեղան*ում*", "transcription": "seghanúm"}	{"russian": "стола́х", "armenian": "սեղաններ*ում*", "transcription": "seghannerúm"}	\N	{}
03a4de0f-b3ca-4aa1-a194-ddfede4fe485	friend	nominative	{"comment": {"russian": ""}, "russian": "друг", "armenian": "ընկեր", "transcription": "enker"}	{"russian": "друзья", "armenian": "ընկերներ", "transcription": "enkerner"}	\N	{}
45f3ccaf-6e21-45b8-b367-189e045475cf	friend	possessive	{"russian": "друга", "armenian": "ընկեր*ոջ*", "transcription": "enkeroch"}	{"russian": "друзей", "armenian": "ընկերներ*ի*", "transcription": "enkerneri"}	ոջ	{}
ce422c01-7fb6-4e89-89de-30cde6e76a58	dog	nominative	{"comment": {"russian": ""}, "russian": "собака", "armenian": "շուն", "transcription": "shun"}	{"comment": {"russian": "беглая гласная *ու*"}, "russian": "собаки", "armenian": "շներ", "transcription": "shner"}	\N	{}
839a178c-4d98-4151-8173-a53936e59358	snow	nominative	{"russian": "снег", "armenian": "ձյուն", "transcription": "dziun"}	{"russian": "снега́", "armenian": "ձյուններ", "transcription": "dziunner"}	\N	{}
b537d585-c20d-42e2-80fa-0cef154f92ce	enemy	nominative	{"russian": "враг", "armenian": "թշնամի", "transcription": "t'shami"}	{"russian": "враги", "armenian": "թշնամիներ", "transcription": "t'shaminer"}	\N	{}
55c6e1e1-dd32-4725-a87f-5702fdc6368c	blood	nominative	{"russian": "кровь", "armenian": "արյուն", "transcription": "ariun"}	{"russian": "крóви", "armenian": "արյուններ", "transcription": "ariunner"}	\N	{}
167e6445-7095-4428-9084-8c1bedcf59fa	angle	nominative	{"russian": "угол", "armenian": "անկյուն", "transcription": "angiun"}	{"russian": "углы", "armenian": "անկյուններ", "transcription": "angiunner"}	\N	{}
b4ec2f6f-995f-46b0-a586-f52d4ddddc65	angle	possessive	{"russian": "угла", "armenian": "անկյ*ա*ն", "transcription": "angian"}	{"russian": "углов", "armenian": "անկյուններ*ի*", "transcription": "angiunneri"}	ա	{}
e27ed8d1-9132-42d7-b5bf-1de70ecbe2a7	blood	possessive	{"russian": "крóви", "armenian": "արյ*ա*ն", "transcription": "arian"}	{"russian": "кровей", "armenian": "արյուններ*ի*", "transcription": "ariunneri"}	ա	{}
4b7c45a4-3afb-468c-aa5c-16dce08d2f35	snow	possessive	{"russian": "снéга", "armenian": "ձյ*ա*ն", "transcription": "dzian"}	{"russian": "снегов", "armenian": "ձյուններ*ի*", "transcription": "dziunner"}	ա	{}
8753cec6-e08b-4593-8b9a-928a06a829a9	enemy	possessive	{"russian": "врага", "armenian": "թշնամ*ու*", "transcription": "t'shamu"}	{"russian": "врагов", "armenian": "թշնամիներ*ի*", "transcription": "t'shaminneri"}	ու	{}
cd956e80-84b6-415c-a6af-1e8e07299506	wind	nominative	{"russian": "ветер", "armenian": "քամի", "transcription": "k'ami"}	{"russian": "ветры", "armenian": "քամիներ", "transcription": "k'aminer"}	\N	{}
306f8eeb-905e-437f-bf8e-e97e78168d00	wind	possessive	{"russian": "ветра", "armenian": "քամ*ու*", "transcription": "k'amu"}	{"russian": "ветров", "armenian": "քամիներ*ի*", "transcription": "k'aminneri"}	ու	{}
b2fa1784-a6e4-49b6-a6d7-fabe8d87e4ba	owner	possessive	{"russian": "владельца", "armenian": "տիր*ոջ*", "transcription": "trnoch"}	{"russian": "владельцев", "armenian": "տերեր*ի*", "transcription": "tereri"}	ոջ	{}
e703d6bb-3cf7-4519-8566-32de06cb907e	home	possessive	{"russian": "дóма", "armenian": "տ*ա*ն", "transcription": "tan"}	{"russian": "домóв", "armenian": "տներ*ի*", "transcription": "tnerí"}	ա	{}
d560b6ad-62cf-4fe3-8774-3545abd24a0d	woman	possessive	{"russian": "жéнщины", "armenian": "կն*ոջ*", "transcription": "knoch"}	{"comment": {"russian": "исключение"}, "russian": "жéнщин", "armenian": "կան*անց*", "transcription": "kanánts"}	ոջ	{}
78d6e7ec-cab4-4cb9-b99a-8cabf6a7cb20	uncle-mother	nominative	{"russian": "дядя", "armenian": "քեռի", "transcription": "k'eri"}	{"russian": "дяди", "armenian": "քեռիներ", "transcription": "k'eriner"}	\N	{}
76c2130f-6e68-442c-982d-228c14702901	uncle-mother	possessive	{"russian": "дяди", "armenian": "քեռ*ու*", "transcription": "k'eru"}	{"russian": "дядей", "armenian": "քեռիներ*ի*", "transcription": "k'erineri"}	ու	{}
eb26fbee-2dfd-4466-a0c7-e8559d758494	villager	nominative	{"russian": "житель деревни", "armenian": "գյուղացի", "transcription": "giughatsi"}	{"russian": "жители деревни", "armenian": "գյուղացիներ", "transcription": "giughatsiner"}	\N	{}
8f1c219a-6650-46d1-9bb1-09e9a1706b2e	villager	possessive	{"russian": "жителя деревни", "armenian": "գյուղաց*ու*", "transcription": "giughatsu"}	{"russian": "жителей деревни", "armenian": "գյուղացիներ*ի*", "transcription": "giughatsineri"}	ու	{}
61dd37e5-600f-4e98-b8b4-c22f5cf23529	man	nominative	{"russian": "человек", "armenian": "մարդ", "transcription": "mard"}	{"russian": "люди", "armenian": "մարդիկ", "transcription": "mardik"}	\N	{}
23d15005-3a42-4b7c-bde5-1c9163623331	husband	nominative	{"russian": "муж", "armenian": "ամուսին", "transcription": "amusin"}	{"russian": "мужья", "armenian": "ամուսիններ", "transcription": "amusinner"}	\N	{}
78432b6a-6c4a-4b25-a1e8-a7fface8e3cf	husband	possessive	{"russian": "мужа", "armenian": "ամուսն*ու*", "transcription": "amusnu"}	{"russian": "мужей", "armenian": "ամուսիններ*ի*", "transcription": "amusinneri"}	ու	{}
95b767c6-9242-4286-9ef2-c4704fbe7bc1	horse	nominative	{"russian": "лошадь", "armenian": "ձի", "transcription": "dzi"}	{"comment": {"russian": "беглая гласная ի"}, "russian": "лошади", "armenian": "ձներ", "transcription": "dzner"}	\N	{}
2335a184-b1c4-47db-9a9d-ab654f4b0b41	horse	possessive	{"russian": "лошади", "armenian": "ձի*ու*", "transcription": "dzu"}	{"russian": "лошадей", "armenian": "ձներ*ի*", "transcription": "dzneri"}	ու	{}
12e23802-8f8b-4b85-aa5a-971e1e11b325	god	nominative	{"russian": "бог", "armenian": "աստված", "transcription": "astvats"}	{"russian": "боги", "armenian": "աստվածներ", "transcription": "astvatsner"}	\N	{}
7dc29ca6-1f08-4026-8efa-48a6d2f57191	god	possessive	{"russian": "бога", "armenian": "աստծ*ու*", "transcription": "asttsu"}	{"russian": "богов", "armenian": "աստվածներ*ի*", "transcription": "astvatsneri"}	ու	{}
a619f9d6-dc47-47c3-87e9-80a7ab6bfa1a	father	nominative	{"russian": "отец", "armenian": "Հայր", "transcription": "hair"}	{"russian": "отцы", "armenian": "Հայրեր", "transcription": "hairer"}	\N	{}
3644b7ba-410a-4940-adf2-54a2ed1e364b	sister	nominative	{"russian": "сестра", "armenian": "քույր", "transcription": "k'uir"}	{"russian": "сестры", "armenian": "քույրեր", "transcription": "k'uirer"}	\N	{}
446fac66-a664-4171-8bd6-185d799c9938	father	possessive	{"russian": "отца", "armenian": "հ*ո*ր", "transcription": "hor"}	{"russian": "отцов", "armenian": "Հայրեր*ի*", "transcription": "haireri"}	ո	{}
781a3ff5-580a-4c84-b954-b62110a59cbd	mother	nominative	{"russian": "мать", "armenian": "մայր", "transcription": "mair"}	{"russian": "матери", "armenian": "մայրեր", "transcription": "mairer"}	\N	{}
aff90ca0-a0fb-4ed2-8074-db4ebf146b5c	brother	nominative	{"russian": "брат", "armenian": "եղբայր", "informal": "ախպեր", "transcription": "eghbair / ahper"}	{"russian": "братья", "armenian": "եղբայրներ", "informal": "ախպերներ", "transcription": "eghbairner / ahperner"}	\N	{}
5ff5e609-9588-420c-bc2a-ee05b7172049	summer	possessive	{"russian": "лéта", "armenian": "ամռ*ան*", "informal": "ամառ*վա*", "transcription": "amaran / amarva"}	{"russian": "лéт", "armenian": "ամառներ*ի*", "transcription": "amarneri"}	ան	{}
931a27e5-02a0-42f4-8a84-f6791344ff44	brother	possessive	{"russian": "брата", "armenian": "եղբ*ո*ր", "informal": "ախպ*ո*ր", "transcription": "eghbor / ahpor"}	{"russian": "братьев", "armenian": "եղբայրներ*ի*", "informal": "ախպերներ*ի*", "transcription": "eghbairneri / ahperneri"}	ո	{}
b312af61-b26a-4234-be98-2e869040f41f	summer	nominative	{"russian": "лето", "armenian": "ամառ", "transcription": "amar"}	{"russian": "лета́", "armenian": "ամառներ", "transcription": "amarner"}	\N	{}
cdc847bb-9267-4e7b-9165-7fb5cca59901	autumn	nominative	{"russian": "осень", "armenian": "աշուն", "transcription": "ashun"}	{"russian": "осени", "armenian": "աշուններ", "transcription": "ashunner"}	\N	{}
679014a4-4da4-40ce-adb5-70d6851aa117	winter	nominative	{"russian": "зима", "armenian": "ձմեռ", "transcription": "dzmer"}	{"russian": "зи́мы", "armenian": "ձմեռներ", "transcription": "dzmerner"}	\N	{}
ba834148-7503-4dab-a9c2-aed36f4104ef	autumn	possessive	{"russian": "осени", "armenian": "աշն*ան*", "transcription": "ashnan"}	{"russian": "осеней", "armenian": "աշուններ*ի*", "transcription": "ashunneri"}	ան	{}
b6911d9b-1a45-455d-bb67-a06a0d0c1017	spring	nominative	{"russian": "весна", "armenian": "գարուն", "transcription": "garun"}	{"russian": "вёсны", "armenian": "գարուններ", "transcription": "garunner"}	\N	{}
1a0d1c52-07d5-4df7-bab2-e0c3cdd80529	spring	possessive	{"russian": "весны", "armenian": "գարն*ան*", "transcription": "garnan"}	{"russian": "вёсен", "armenian": "գարուններ*ի*", "transcription": "garunneri"}	ան	{}
0667d554-f615-4f87-b531-4e340bb82801	winter	possessive	{"russian": "зимы́", "armenian": "ձմռ*ան*", "informal": "ձմեռվա", "transcription": "dzmran / dzmerva"}	{"russian": "зим", "armenian": "ձմեռներ*ի*", "transcription": "dzmerneri"}	ան	{}
4bf6dd28-cf81-407b-9d41-7f1c33ecf0e1	door	nominative	{"russian": "дверь", "armenian": "դուռ", "transcription": "dur"}	{"comment": {"russian": "беглая гласная ու"}, "russian": "двери", "armenian": "դռներ", "transcription": "drner"}	\N	{}
8bb68a94-1e87-41a3-b2c0-d03d27703045	door	possessive	{"russian": "двери", "armenian": "դռ*ան*", "transcription": "dran"}	{"russian": "дверей", "armenian": "դռներ*ի*", "transcription": "drneri"}	ան	{}
9d9bac00-67f2-41d4-a32b-847ee8260b66	rock-mountain	nominative	{"russian": "скала", "armenian": "լեռ", "transcription": "ler"}	{"russian": "ска́лы", "armenian": "լեռներ", "transcription": "lerner"}	\N	{}
9b087b36-0fde-4f67-ad9b-b01e2d6df51e	man	possessive	{"russian": "человека", "armenian": "մարդ*ու*", "transcription": "mardu"}	{"comment": {"russian": "исключение"}, "russian": "людей", "armenian": "մարդկ*անց*", "transcription": "mardkants"}	ու	{}
e6597d8b-c220-4fbc-90c3-ef88104fb073	rock-mountain	possessive	{"russian": "скалы́", "armenian": "լեռ*ան*", "transcription": "leran"}	{"russian": "скал", "armenian": "լեռներ*ի*", "transcription": "lerneri"}	ան	{}
41f24100-12d7-40ac-8c09-845f938fb652	fish	nominative	{"russian": "рыба", "armenian": "ձուկ", "transcription": "dzuk"}	{"russian": "рыбы", "armenian": "ձկներ", "transcription": "dzkner"}	\N	{}
6a92c93f-04e0-4598-915b-ad75a88ee311	fish	possessive	{"russian": "рыбы", "armenian": "ձկ*ան*", "transcription": "dzkan"}	{"russian": "рыб", "armenian": "ձկներ*ի*", "transcription": "dzkneri"}	ան	{}
b5d5c97c-e12d-420f-a90f-4353c8f527be	mouse	nominative	{"russian": "мышь", "armenian": "մուկ", "transcription": "muk"}	{"russian": "мыши", "armenian": "մկներ", "transcription": "mkner"}	\N	{}
8103f80c-60eb-4e2f-83b9-b889df4f9931	mouse	possessive	{"russian": "мыши", "armenian": "մկ*ան*", "transcription": "mkan"}	{"russian": "мышей", "armenian": "մկներ*ի*", "transcription": "mkneri"}	ան	{}
ccf1e805-76ff-419b-a08d-95c2909000b2	grandchild	nominative	{"russian": "внук", "armenian": "թոռ", "transcription": "tor"}	{"russian": "внуки", "armenian": "թոռներ", "transcription": "torner"}	\N	{}
53711a52-2d3c-4296-98f0-3a8906c9c556	grandchild	possessive	{"russian": "внука", "armenian": "թոռ*ան*", "transcription": "toran"}	{"russian": "внуков", "armenian": "թոռներ*ի*", "transcription": "torneri"}	ան	{}
198c337b-093c-4c6b-a755-8dc3af4f316c	day	nominative	{"russian": "день", "armenian": "օր", "transcription": "or"}	{"russian": "дни", "armenian": "օրեր", "transcription": "orer"}	\N	{}
269563fa-6f6b-4d3a-8f2b-bb51850c6c5a	day	possessive	{"russian": "дня", "armenian": "օր*վա*", "transcription": "orva"}	{"russian": "дней", "armenian": "օրեր*ի*", "transcription": "orereri"}	վա	{}
87867eba-5610-4e14-945e-c95b4265fd43	month	nominative	{"russian": "месяц", "armenian": "ամիս", "transcription": "amis"}	{"russian": "месяцы", "armenian": "ամիսներ", "transcription": "amisner"}	\N	{}
0494bab9-e5fa-4c90-b8b5-4d7a89ba795c	month	possessive	{"russian": "месяца", "armenian": "ամս*վա*", "transcription": "amsva"}	{"russian": "месяцев", "armenian": "ամիսներ*ի*", "transcription": "amisneri"}	վա	{}
d58194ed-0fa4-4703-ac9f-6cebfd246a2c	morning	nominative	{"russian": "утро", "armenian": "առավոտ", "transcription": "aravot"}	{"russian": "утра́", "armenian": "առավոտներ", "transcription": "aravotner"}	\N	{}
367b06ae-29d5-401d-b85e-2ce9cb7d2a55	morning	possessive	{"russian": "у́тра", "armenian": "առավոտվա", "transcription": "aravotva"}	{"russian": "утр", "armenian": "առավոտների", "transcription": "aravotneri"}	վա	{}
87675d9d-1dab-419c-9bc5-b7c9a858bfd0	yesterday	nominative	{"russian": "вчера", "armenian": "երեկ", "transcription": "yerek"}	{"armenian": ""}	\N	{}
bcd42df8-d45f-4762-bd7f-f90e9b8ce077	tomorrow	nominative	{"russian": "завтра", "armenian": "վաղը", "transcription": "vaghe"}	{}	\N	{}
896bbb2d-f2af-432f-8277-418a94ba4bf6	tomorrow	possessive	{"russian": "завтрашний", "armenian": "վաղ*վա*", "transcription": "vaghva"}	{}	վա	{}
bfb9b863-6a7b-4882-8760-90a7020c984f	yesterday	possessive	{"russian": "вчерашний", "armenian": "երեկ*վա*", "transcription": "yerekva"}	{}	վա	{}
a2739bed-62e9-4b10-9628-11d161c9c261	day-time	nominative	{"russian": "день", "armenian": "ցերեկ", "transcription": "tserek"}	{}	\N	{}
b4198051-ddb7-4d18-9b17-6832604e8461	day-time	possessive	{"russian": "дневной / денный", "armenian": "ցերեկ*վա*", "transcription": "tserekva"}	{}	վա	{}
5c4bfe51-8149-4d6f-83a7-0699ae7bbcbb	year	nominative	{"russian": "год", "armenian": "տարի", "transcription": "tari"}	{"russian": "гóды/года́", "armenian": "տարիներ", "transcription": "tariner"}	\N	{}
6eac5a08-9486-4c97-a605-d6753410b97a	minute	nominative	{"russian": "минута", "armenian": "րոպե", "transcription": "rope"}	{"russian": "минуты", "armenian": "րոպեներ", "transcription": "ropener"}	\N	{}
93e51a29-2e2d-42a7-bc4f-d77b06726d20	minute	possessive	{"russian": "минуты", "armenian": "րոպե*ի*", "transcription": "rope'i"}	{"russian": "минут", "armenian": "րոպեներ*ի*", "transcription": "ropeneri"}	վա	{}
557807e4-d6f2-446e-bdab-a38ee34d72d7	year	possessive	{"russian": "гóда", "armenian": "տար*վա*", "transcription": "tarva"}	{"russian": "годóв", "armenian": "տարիներ*ի*", "transcription": "tarineri"}	վա	{}
f21582e2-bf21-4e25-90c5-7852f703340e	second	nominative	{"russian": "секунда", "armenian": "վայրկյան", "transcription": "vairkian"}	{"russian": "секунды", "armenian": "վայրկյաններ", "transcription": "vairkianner"}	\N	{}
2893b3c3-4a49-473c-ab39-a0693feb8e29	century	nominative	{"russian": "век", "armenian": "դար", "transcription": "dar"}	{"russian": "века́", "armenian": "դարեր", "transcription": "darer"}	\N	{}
a1fdb445-fe40-4ebc-820f-cb22c292c067	century	possessive	{"russian": "вéка", "armenian": "դար*ի*", "transcription": "dari"}	{"russian": "веков", "armenian": "դարեր*ի*", "transcription": "dareri"}	վա	{}
a89f7ccd-c350-4989-a908-a561bdad0d83	evening	nominative	{"russian": "вечер", "armenian": "երեկո", "transcription": "yereko"}	{"russian": "вечера", "armenian": "երեկոներ", "transcription": "yerekoner"}	\N	{}
7f0e8ac2-a84c-4c68-9c17-04f7bb08af36	evening	possessive	{"russian": "вечера", "armenian": "երեկոյ*ի*", "transcription": "yereko'i"}	{"russian": "вечеров", "armenian": "երեկոներ*ի*", "transcription": "yerekoneri"}	վա	{}
c5003f44-ce02-4b34-9bc7-c55740ca8246	second	possessive	{"russian": "секунды", "armenian": "վայրկյան*ի*", "transcription": "vairkiani"}	{"russian": "секунд", "armenian": "վայրկյաններ*ի*", "transcription": "vairkianneri"}	վա	{}
ce5e7cc4-3312-4316-8898-c93046066b90	mother	possessive	{"russian": "матери", "armenian": "մ*ո*ր", "transcription": "mor"}	{"russian": "матерей", "armenian": "մայրեր*ի*", "transcription": "maireri"}	ո	{}
c6d33901-cafd-4621-b8d5-5a5bb5375ea2	we-group	nominative	{"comment": {"russian": "как группа, объединенная чем-то"}, "russian": "мы/наши", "armenian": "մերոնք", "transcription": "meronk"}	{}	\N	{}
69b11064-86a3-4680-8cbf-969f21696372	pomegranate	nominative	{"russian": "гранат", "armenian": "նուռ", "transcription": "nur"}	{"comment": {"russian": "беглая гласная ու"}, "russian": "гранаты", "armenian": "նռներ", "transcription": "nrner"}	\N	{}
47fd3eee-69c2-4c2e-ae3c-c77c43445326	pomegranate	possessive	{"russian": "граната", "armenian": "նռ*ան*", "transcription": "nran"}	{"russian": "гранатов", "armenian": "նռներ*ի*", "transcription": "nrneri"}	ան	{}
3b51e963-b9a0-4ce5-81ac-9d21f39a8648	you-group	nominative	{"comment": {"russian": "как группа, объединенная чем-то"}, "russian": "вы/ваши", "armenian": "ձերոնք", "transcription": "dzeronk"}	{}	\N	{}
9c75cd1f-652e-4f91-aed3-63ff92337484	you-group	possessive	{"russian": "ваших", "armenian": "ձերոն*ց*", "transcription": "dzernats"}	{}	ց	{}
6bda3f40-ddf8-43f2-91fe-8f57977c62de	we-group	possessive	{"russian": "нас/наших", "armenian": "մերոն*ց*", "transcription": "meronts"}	{}	ց	{}
be7210db-2194-4f1d-a72d-21c116dd8be1	girl	nominative	{"russian": "девочка", "armenian": "աղջիկ", "transcription": "aghchik"}	{"russian": "девочки", "armenian": "աղջիկներ", "transcription": "aghchikner"}	\N	{}
658c4a14-f50b-488e-81e0-bbc40440c3c4	girl	possessive	{"russian": "девочки", "armenian": "աղջկ*ա*", "transcription": "aghchka"}	{"russian": "девочек", "armenian": "աղջիկներ*ի*", "transcription": "aghchikneri"}	\N	{}
3f8bbc25-0506-4e96-95a3-1b7ea76cd97b	love	nominative	{"russian": "любовь", "armenian": "սեր", "transcription": "ser"}	{"armenian": ""}	\N	{}
ab3b31ad-f698-4f0d-9cdc-c6c4b21c5b3d	love	possessive	{"russian": "любви", "armenian": "սիրո", "transcription": "siro"}	{}	\N	{}
df3f3b12-73ef-45c7-a70d-100782ce5431	meeting	nominative	{"russian": "встреча", "armenian": "հանդիպում", "transcription": "handipum"}	{"russian": "встречи", "armenian": "հանդիպումներ", "transcription": "handipumner"}	\N	{}
327656a8-5d19-4c26-ab7a-c68d7fd1abd2	meeting	possessive	{"russian": "встречи", "armenian": "հանդիպման", "transcription": "handipman"}	{"russian": "встреч", "armenian": "հանդիպումների", "transcription": "handipumneri"}	\N	{}
bd4e29a2-a110-48d0-9b5d-cad1563abb80	tunnel	nominative	{"russian": "тоннель", "armenian": "թունել", "transcription": "tunel"}	{"russian": "тоннели", "armenian": "թունելներ", "transcription": "tunelner"}	\N	{}
58ff5a6a-cab9-4ed6-a2ea-eb4a9f4ac621	tunnel	possessive	{"russian": "тоннеля", "armenian": "թունել*ի*", "transcription": "tuneli"}	{"russian": "тоннели", "armenian": "թունելներ*ի*", "transcription": "tunelneri"}	\N	{}
\.
COPY public.noun_case_example (id, noun_id, case_id, example, prepostposition_id) FROM stdin;
26330ae6-b107-46d3-9567-193f150d5a7d	table	possessive	{"russian": "для стола́", "armenian": "սեղան*ի* համար", "transcription": "seghani hamar"}	for
5c6d8a3d-302f-4dac-81f3-c8c8fcd56fbe	table	possessive	{"russian": "у стола́", "armenian": "սեղան*ի* մոտ", "transcription": "seghani mot"}	at
22366031-5dfd-482f-8275-d82508c16d36	table	possessive	{"russian": "рядом со столóм", "armenian": "սեղան*ի* կողքին", "transcription": "seghani koghk'in"}	near
b1863b93-789c-4186-9d9b-2877d7534f5c	table	possessive	{"russian": "на столé", "armenian": "սեղան*ի* վրա", "informal": "սեղանին", "transcription": "seghani vra / seghanin"}	on
8259c9bd-99d3-4243-81bb-44cfeb63cbdc	table	possessive	{"russian": "вместо стола́", "armenian": "սեղան*ի* փոխարեն", "transcription": "seghani poharen"}	instead
48ca1cf8-ddef-4d4f-a9f5-8f1c5c93cd82	table	possessive	{"russian": "в столé", "armenian": "սեղան*ի* մեջ", "transcription": "seghani mech"}	in
455687d0-d906-43e9-9294-8fb093ee61ff	table	possessive	{"russian": "между стола́ми", "armenian": "սեղաններ*ի* միջև", "transcription": "seghani michev"}	between
39ab766b-98e6-46ba-a582-0d21b9f734e8	table	possessive	{"russian": "под столóм", "armenian": "սեղան*ի* տակ", "transcription": "serghani tak"}	under
9137b77f-163f-4126-9eee-30ab78537196	table	possessive	{"russian": "перед столóм", "armenian": "սեղան*ի* առաջ", "transcription": "seghani arach"}	before
deb96b1c-a71a-4cfc-ad69-2a7f66be4bca	table	possessive	{"comment": {"russian": ""}, "russian": "цвет стола́", "armenian": "սեղան*ի* գույն*ը*", "transcription": "seghani k'uine"}	\N
c36a4c1e-536a-422d-a561-4cc2d877cc83	table	possessive	{"russian": "про стол", "armenian": "սեղան*ի* մասին", "transcription": "seghani masin"}	about
3faaf86b-298f-4fa1-bda8-e8b8648c9599	friend	possessive	{"russian": "под другом", "armenian": "ընկեր*ոջ* տակ", "transcription": "enkeroch tak"}	under
6ef0c1ef-36f5-4ba3-aa03-4d03b3ade9fc	table	possessive	{"russian": "Мне интересно все, связанное с этим столом", "armenian": "Այս սեղան*ի* հետ կապված ինձ ամեն ինչ հետաքրքիր է", "informal": "", "transcription": "ais seghani het vapvats inz amen inch hetak'rk'ir e"}	with
9d6911af-1635-46e6-ab0b-dec6869f5489	friend	possessive	{"russian": "дом друга", "armenian": "ընկեր*ոջ* տունը", "transcription": "enkeroch tune"}	\N
b284d99c-334c-42e8-9221-5ae8936ba231	friend	possessive	{"russian": "между друзьями", "armenian": "ընկերներ*ի* միջև", "transcription": "enkerneri michev"}	between
cf61f220-bfd8-42a0-882f-ef3304c1c8fd	friend	possessive	{"russian": "про друга", "armenian": "ընկեր*ոջ* մասին", "transcription": "enkeroch masin"}	about
90b7497e-ed8f-4c0c-864e-c44bff7e0ea8	friend	possessive	{"russian": "в друге", "armenian": "ընկեր*ոջ* մեջ", "transcription": "enkeroch mech"}	in
1217c7d2-f6cf-42f5-bab2-efda82b717b0	friend	possessive	{"russian": "вместо друга", "armenian": "ընկեր*ոջ* փոխարեն", "transcription": "enkeroch poharen"}	\N
846d410c-dd55-41b7-a192-3895955576c3	friend	possessive	{"russian": "на друге", "armenian": "ընկեր*ոջ* վրա", "transcription": "enkeroch vra"}	on
141b5012-317c-4a35-a43b-588d7e6f69d5	friend	possessive	{"russian": "рядом с другом", "armenian": "ընկեր*ոջ* կողքին", "transcription": "enkeroch koghk'in"}	near
e8d84ef8-0422-440d-b405-b87fc28c0983	friend	possessive	{"russian": "у друга", "armenian": "ընկեր*ոջ* մոտ", "transcription": "enkeroch mot"}	at
ed2bf561-7a78-4722-ba7a-fb4d75148c9d	friend	possessive	{"russian": "для друга", "armenian": "ընկեր*ոջ* համար", "informal": "", "transcription": "enkeroch hamar"}	for
cf34995b-e8cb-4a2a-bd06-5d56bd1bc1d9	table	possessive	{"comment": {"russian": "по причине"}, "russian": "из-за стола", "armenian": "սեղան*ի* պատճառով", "transcription": "seghani patjarov"}	because-of
ea773f22-92ec-4285-ba16-c1b2d6a86dc9	tunnel	possessive	{"comment": {"russian": "здесь միջով это մեջ (в) в творительном падеже"}, "russian": "через тоннель / по тоннелю", "armenian": "թունել*ի* միջով"}	through
7b7b230f-c18c-41c3-86fd-dd63c1b290d2	pomegranate	possessive	{"russian": "цвет граната", "armenian": "նռ*ան* գույն*ը*", "transcription": ""}	\N
64fced33-9495-4de6-a617-f4b8bc271c90	wine	possessive	{"russian": "вкус вина", "armenian": "գինու համը", "transcription": "ginu ham@"}	\N
533c6f0d-381d-4c54-8ab5-bfe2f8f807b6	table	possessive	{"russian": "как стол", "armenian": "սեղան*ի* նման/պես ", "transcription": "seghani nman/pes"}	like
\.
COPY public.numeral (id, comment, description) FROM stdin;
1	{}	{}
2	{}	{}
3	{}	{}
4	{}	{}
5	{}	{}
6	{}	{}
7	{}	{}
8	{}	{}
9	{}	{}
0	{}	{}
10	{}	{}
11	{}	{}
12	{}	{}
13	{}	{}
14	{}	{}
15	{}	{}
16	{}	{}
17	{}	{}
18	{}	{}
19	{}	{}
20	{}	{}
21	{}	{}
30	{}	{}
40	{}	{}
50	{}	{}
60	{}	{}
70	{}	{}
80	{}	{}
90	{}	{}
100	{}	{}
1000	{}	{}
\.
COPY public.numeral_case (id, numeral_id, case_id, single, plural, comment) FROM stdin;
149b551b-e94e-481b-96a6-caccf63577dc	1	nominative	{"russian": "оди́н", "armenian": "մեկ", "transcription": "mek"}	{"russian": "едини́цы", "armenian": "մեկեր", "transcription": "meker"}	{}
8a179e0c-6145-48b7-be63-0bca287c61cb	1	possessive	{"russian": "одногó", "armenian": "մեկ*ի*", "transcription": "mekí"}	{"russian": "едини́ц", "armenian": "մեկեր*ի*", "transcription": "mekerí"}	{}
d0c7f486-4449-4f76-90d6-7c96bfe00271	2	nominative	{"russian": "два", "armenian": "երկու", "transcription": "yerkú"}	{"russian": "двойки", "armenian": "երկուսներ", "transcription": "yerkusnér"}	{}
48a2894e-9399-4adc-8296-89a02080551c	2	possessive	{"russian": "двух", "armenian": "երկու*սի*", "transcription": "yerkusí"}	{"russian": "двóек", "armenian": "երկուսներ*ի*", "transcription": "yerkusnerí"}	{}
e8b800f2-7831-45b6-a558-c7b6b797d5e5	3	nominative	{"russian": "три", "armenian": "երեք", "transcription": "yerek'"}	{"russian": "трóйки", "armenian": "երեքներ", "transcription": "yerek'nér"}	{}
2eb29013-c58e-4116-928a-8899a69c3a73	3	possessive	{"russian": "трёх", "armenian": "երեք*ի*", "transcription": "yerek'í"}	{"russian": "трóек", "armenian": "երեքներ*ի*", "transcription": "yerek'nerí"}	{}
29227dde-e6b2-45f3-bef5-e960a06e68fc	4	nominative	{"russian": "четы́ре", "armenian": "չորս", "transcription": "chors"}	{"russian": "четверки", "armenian": "չորսեր", "transcription": "chorsér"}	{}
ca6fe1bd-c73b-4df5-830a-517528957703	4	possessive	{"russian": "четырéх", "armenian": "չորս*ի*", "transcription": "chorsí"}	{}	{}
764d2db6-9d83-4096-8cd4-edd748b033db	5	nominative	{"russian": "пять", "armenian": "Հինգ", "transcription": "hing"}	{"armenian": ""}	{}
e481b47b-93fb-4821-a5ac-4c1d384bb5e4	5	possessive	{"russian": "пяти́", "armenian": "Հինգ*ի*", "transcription": "hingí"}	{}	{}
de6ce0fd-db58-49e9-a1dc-6ca59b6c3ada	6	nominative	{"russian": "шесть", "armenian": "վեց", "transcription": "vets"}	{}	{}
077e9e9c-466d-4b03-b7ef-17a6907d91a5	6	possessive	{"russian": "шести́", "armenian": "վեց*ի*", "transcription": "vetsí"}	{}	{}
368f8732-750c-41b3-8e35-4387d9ac831f	7	nominative	{"russian": "семь", "armenian": "յոթ", "transcription": "yot'"}	{}	{}
c1864363-7a66-4f25-aaf4-6fa1edb2a907	7	possessive	{"russian": "семи́", "armenian": "յոթ*ի*", "transcription": "yot'í"}	{}	{}
57d08a05-0065-419d-841c-57c52a91c5cf	8	nominative	{"russian": "вóсемь", "armenian": "ութ", "transcription": "ut'"}	{}	{}
7a6436c3-4aed-4e76-946b-89d39cbe6c06	8	possessive	{"russian": "восьми́", "armenian": "ութ*ի*", "transcription": "ut'í"}	{}	{}
a80309ea-bcd8-4878-8d39-8de861cc97ae	9	nominative	{"russian": "дéвять", "armenian": "ինը", "transcription": "ine"}	{}	{}
c8d37fd2-5148-4b77-81eb-f0474b77a8a5	9	possessive	{"russian": "девяти́", "armenian": "ինն*ի*", "transcription": "inní"}	{}	{}
3ceb041a-d49a-4f97-92e3-a63325506263	0	nominative	{"russian": "ноль", "armenian": "զրո", "transcription": "zro"}	{"russian": "ноли́", "armenian": "զրոներ", "transcription": "zroner"}	{}
40967edb-4d6a-4647-b74b-583aaf58f6c0	0	possessive	{"russian": "ноля́", "armenian": "զրո*յի*", "transcription": "zrojí"}	{"russian": "нолéй", "armenian": "զրոներ*ի*", "transcription": "zronnerí"}	{}
7eba9a3b-8087-4570-9497-622d301dca26	10	possessive	{"russian": "десяти", "armenian": "տաս*ի*", "transcription": "tasi"}	{}	{}
63b7ec0a-c024-4f19-8d38-343e7909dd8a	11	possessive	{"russian": "одиннадцати", "armenian": "տասնմեկ*ի*", "transcription": "tasnmeki"}	{}	{}
4783871a-a3e9-4b03-8f00-3ec363d4c8b3	12	nominative	{"russian": "двенадцать", "armenian": "տասներկու", "transcription": "tasnerku"}	{}	{}
79c95e84-b242-4f41-a5c2-7bfcac6fe145	12	possessive	{"russian": "двенадцати", "armenian": "տասներկուս*ի*", "transcription": "tasnerkusi"}	{}	{}
d10f2a0f-66a1-4845-98af-b62a0cbcfa2f	11	nominative	{"russian": "одиннадцать", "armenian": "տասնմեկ", "transcription": "tasnemek"}	{}	{}
3d6a5c5d-3b13-4f1f-bd4c-5f8e29ca7fb7	13	nominative	{"russian": "тринадцать", "armenian": "տասներեք", "transcription": "tasnerek'"}	{}	{}
acb1e4c1-a76a-44b3-ac84-d248b8834f01	13	possessive	{"russian": "тринадцати", "armenian": "տասներեք*ի*", "transcription": "tasnereki"}	{}	{}
3a940794-7679-41df-b064-3963ed783a13	20	nominative	{"russian": "двадцать", "armenian": "քսան", "transcription": "ksan"}	{}	{}
0edc19d9-256a-4b86-ac89-dd5fb56a994f	20	possessive	{"russian": "двадцати", "armenian": "քսան*ի*", "transcription": "ksani"}	{}	{}
0666fbc1-5aef-458e-a0cb-d0995836fc90	30	nominative	{"russian": "тридцать", "armenian": "երեսուն", "transcription": "yeresun"}	{}	{}
4588dc8d-697e-43c2-a99c-8e739d9f5539	30	possessive	{"russian": "тридцати", "armenian": "երեսուն*ի*", "transcription": "yeresuni"}	{}	{}
8ae29edc-9f28-4ed3-a99a-0a3d441b0f76	100	nominative	{"russian": "сто", "armenian": "հարյուր", "transcription": "hariur"}	{}	{}
6fe5c9ca-5217-46a4-9f6f-84f98e1fd156	100	possessive	{"russian": "ста", "armenian": "հարյուր*ի*", "transcription": "hariuri"}	{}	{}
908a8c41-3ab7-45f0-8322-e602063c9a51	1000	nominative	{"russian": "тысяча", "armenian": "հազար", "transcription": "hazar"}	{}	{}
b786d444-b9bb-4729-ab97-710ec5f7dc0d	1000	possessive	{"russian": "тысячи", "armenian": "հազար*ի*", "transcription": "hazari"}	{}	{}
d4913b89-112e-42d3-80d4-3bc01b2b1efd	10	nominative	{"russian": "десять", "armenian": "տաս", "informal": "", "transcription": "tas"}	{}	{}
\.
COPY public.numeral_case_example (id, numeral_id, case_id, example, prepostposition_id) FROM stdin;
\.
COPY public.prepostposition (id, name, comment) FROM stdin;
about	{"russian": "про", "armenian": "մասին"}	{}
with	{"russian": "с", "armenian": "հետ"}	{}
instead	{"russian": "вместо", "armenian": "փոխարեն"}	{}
under	{"russian": "под", "armenian": "տակ"}	{}
between	{"russian": "между", "armenian": "միջև"}	{}
for	{"russian": "для", "armenian": "համար"}	{}
at	{"russian": "у", "armenian": "մոտ"}	{}
near	{"russian": "рядом с", "armenian": "կողքին"}	{}
on	{"russian": "на", "armenian": "վրա"}	{}
before	{"russian": "перед", "armenian": "առաջ"}	{}
through	{"russian": "через", "armenian": "միջով"}	{"russian": "через/по"}
in	{"russian": "в", "armenian": "մեջ"}	{}
behind	{"russian": "за", "armenian": "հետևում"}	{}
because-of	{"russian": "из-за", "armenian": "պատճառով"}	{"russian": "причина"}
like	{"russian": "как", "armenian": "նման/պես"}	{}
\.
COPY public.prepostposition_case (id, prepostposition_id, case_id, single, comment) FROM stdin;
c631cdd0-672f-4764-96d8-bc57c3c37f4a	near	nominative	{"russian": "у", "armenian": "մոտ", "transcription": "mot"}	{}
d692bc95-f5b4-45f6-8776-b678dece0c79	near	possessive	{"russian": "у", "armenian": "մոտ*ի*", "transcription": "moti"}	{}
4ddecb1f-0613-4b7e-9ca5-9d1367cc51cb	on	nominative	{"russian": "на", "armenian": "վրա", "transcription": "vra"}	{}
2685ccd8-d9e3-40f1-8fce-f7ec9b9ba148	on	possessive	{"russian": "на", "armenian": "վրա*յի*", "transcription": "vra'i"}	{}
e0f37042-93b8-4635-b29a-81cfb7349fc6	with	nominative	{"russian": "с", "armenian": "հետ", "transcription": "het"}	{}
5880783c-0add-4d17-ad34-a095ff2f8122	with	possessive	{"russian": "с", "armenian": "հետ*ի*", "transcription": "heti"}	{}
727c642f-142e-4659-b742-2729be250307	under	nominative	{"russian": "под", "armenian": "տակ", "transcription": "tak"}	{}
a7432071-716c-427a-a5f7-d31530ef74b9	under	possessive	{"russian": "под", "armenian": "տակ*ի*", "transcription": "taki"}	{}
5c6f0532-23f7-470d-8228-65945fa6a67b	between	nominative	{"russian": "в", "armenian": "մեջ", "transcription": "mech"}	{}
bdab32dd-1251-46f3-a709-df20db4b33ed	between	possessive	{"russian": "в", "armenian": "մեջ*ի*", "transcription": "mechi"}	{}
\.
COPY public.prepostposition_case_example (id, case_id, example, prepostposition_id) FROM stdin;
77c7645f-6773-4f08-b111-bfbbbc3256df	possessive	{"russian": "иду в магазин в окрестностях дома", "armenian": "տան մոտի խանութն եմ գնում"}	near
20095769-56f5-40bb-bfbb-1b1eb31443fc	possessive	{"russian": "мальчик, который с тобой", "armenian": "քո հետի տղան"}	with
25150982-4a85-4f21-8cca-ed9bc578ab07	possessive	{"russian": "мяч, который под столом", "armenian": "սեղանի տակի գնդակը"}	under
320e24f5-9fb9-433e-9ac4-5ae67cdae2db	possessive	{"russian": "книга, которая на столе", "armenian": "սեղանի վրայի գիրքը"}	on
\.
COPY public.pronoun (id, comment, description) FROM stdin;
i	{}	{}
you	{}	{}
you-plural	{}	{}
he/she	{}	{}
we	{}	{}
they	{}	{}
this	{}	{}
that	{}	{}
\.
COPY public.pronoun_case (id, pronoun_id, case_id, single, comment, plural) FROM stdin;
199fbfb3-f90e-4af5-8bfc-398da3fd82e8	i	nominative	{"russian": "я", "armenian": "ես", "transcription": "yes"}	{}	{}
1bdf80cf-526f-45f8-b013-75e7d7721c65	i	possessive	{"russian": "мой", "armenian": "իմ", "transcription": "im"}	{}	{}
d59b0349-e102-4d75-b55f-9b3a69b5c390	you	nominative	{"russian": "ты", "armenian": "դու", "transcription": "du"}	{}	{}
a4f0d3f2-f04d-431a-b720-314a4f23d19b	you	possessive	{"russian": "твой", "armenian": "քո", "transcription": "k'o"}	{}	{}
b500f5cd-d469-4d46-8baf-f2f982e56897	you-plural	nominative	{"russian": "вы", "armenian": "դուք", "transcription": "duk'"}	{}	{}
43975bc2-2e3a-4439-af5a-066ba39ce535	you-plural	possessive	{"russian": "ваш", "armenian": "ձեր", "transcription": "dzer"}	{}	{}
20d7576e-0128-45f7-8f95-33a0bac77553	he/she	nominative	{"russian": "он/она", "armenian": "նա", "transcription": "na"}	{}	{}
c3163489-1b37-4f61-935e-fc61a73b3ec3	he/she	possessive	{"russian": "его/её/свой(его)", "armenian": "նրա", "informal": "իր", "transcription": "nra/ir"}	{}	{}
dbedfbd7-de41-4cd7-a01f-61cf385881f6	we	nominative	{"russian": "мы", "armenian": "մենք", "transcription": "menk"}	{}	{}
7bd4bf99-913c-4639-8cb2-7272968f6a6f	we	possessive	{"russian": "наш", "armenian": "մեր", "transcription": "mer"}	{}	{}
5dd17e45-2dd4-450c-a92d-f044e94b1b52	they	nominative	{"russian": "они́", "armenian": "նրանք", "transcription": "nrank"}	{}	{}
4ab4f97c-be7f-4129-b8b7-dc87d55ddbeb	they	possessive	{"russian": "их/свои́(их)", "armenian": "նրանց", "informal": "իրենց", "transcription": "nrants/irénts"}	{}	{}
ac159823-3f32-4320-b0d2-3d899fe27eb2	this	nominative	{"russian": "это", "armenian": "սա", "transcription": "sa"}	{}	{"russian": "эти", "armenian": "սրանք", "transcription": "srank'"}
e36fa0c2-9f46-4c5d-8463-12aaf97bb654	that	nominative	{"russian": "то", "armenian": "դա", "transcription": "da"}	{}	{"russian": "те", "armenian": "դրանք", "transcription": "drank"}
0f28f0fc-e85e-4460-88b6-2a29ecb7ccbd	that	locative	{"russian": "том", "armenian": "դրան*ում*", "transcription": "dranum"}	{}	{"russian": "тех", "armenian": "դրանց*ում՛*", "transcription": "drantsum"}
1ae9a2f5-9da6-4b3c-85b8-78feb949b612	i	dative	{"russian": "мне/меня", "armenian": "ինձ", "transcription": "inz"}	{}	{}
e037ab13-9b79-4ca7-a531-6c84f7bb384a	that	dative	{"comment": {"russian": "не употребляется в отношении людей"}, "russian": "то", "armenian": "դրա*ն*", "transcription": "dran"}	{}	{"russian": "те", "armenian": "դրա*նց*", "transcription": "drants"}
148d321d-62a4-4d57-b0f4-769ba3ac3967	that	possessive	{"russian": "того", "armenian": "դր*ա*", "transcription": "dra"}	{}	{"russian": "тех", "armenian": "դր*անց*", "transcription": "drants"}
6b94fb9d-c294-44af-8c63-5915e2491001	this	dative	{"comment": {"russian": "не употребяется в отношении людей"}, "russian": "это", "armenian": "սրա*ն*", "transcription": "sran"}	{}	{"russian": "эти", "armenian": "սրա*նց*", "transcription": "srants"}
b827c3e2-b0e2-446e-b645-528806977fb3	this	possessive	{"russian": "этого", "armenian": "սր*ա*", "transcription": "sra"}	{}	{"russian": "этих", "armenian": "սր*անց*", "transcription": "srants"}
67189642-0b9a-46ba-8b07-8ac83aaf3aa5	this	locative	{"russian": "этом", "armenian": "սրան*ում*", "transcription": "sranum"}	{}	{"russian": "этих", "armenian": "սրանց*ում*", "transcription": "srantsum"}
2181671c-5e2d-4419-902a-463d38901dd8	this	instrumental	{"russian": "этим", "armenian": "սրան*ով*", "transcription": "sranov"}	{}	{"russian": "этими", "armenian": "սրանց*ով*", "transcription": "srantsov"}
c3290133-df83-4da2-afef-cd578eccbb86	this	ablative	{"russian": "этого", "armenian": "սրան*ից*", "transcription": "sranits"}	{}	{"russian": "этих", "armenian": "սրանց*ից*", "transcription": "srantsits"}
473bd718-78f0-4918-9a45-8311849fa07f	that	ablative	{"russian": "того", "armenian": "դրան*ից*", "transcription": "dranits"}	{}	{"russian": "тех", "armenian": "դրան*ցից*", "transcription": "drantsits"}
fa7c696c-cb1c-4e3d-9e88-f72eaac52cd9	that	instrumental	{"russian": "тем", "armenian": "դրան*ով*", "transcription": "dranov"}	{}	{"russian": "теми", "armenian": "դրան*ցով*", "transcription": "drantsov"}
a36d46e0-33a4-430e-9a34-e8a9d537677e	you	dative	{"russian": "тебе/тебя", "armenian": "քեզ", "transcription": "kez"}	{}	{}
a05a320e-ad7c-4918-b0cd-b252ee4590ca	you-plural	dative	{"russian": "вам/вас", "armenian": "ձեզ", "transcription": "dzez"}	{}	{}
15c51a93-0e93-4e27-a430-566c1da72c8a	he/she	dative	{"russian": "ему/ей/его/ее", "armenian": "նրան", "informal": "իրեն", "transcription": "nran / iren"}	{}	{}
dfe3c8b2-8d88-4dc9-8fc3-cb08be156b85	we	dative	{"russian": "нам/нас", "armenian": "մեզ", "transcription": "mez"}	{}	{}
5a79493d-e29d-4d99-a4a4-6bb9606abc97	they	dative	{"russian": "им/их/ними", "armenian": "նրանց", "informal": "իրենց", "transcription": "nrants / irents"}	{}	{}
7f191728-8d93-4bad-b358-10eb27a585b0	i	ablative	{"russian": "меня", "armenian": "ինձանից", "informal": "ինձնից", "transcription": "inzanits / inznits"}	{}	{}
\.
COPY public.pronoun_case_example (id, pronoun_id, case_id, example, prepostposition_id) FROM stdin;
6c439551-d72b-4c33-80ff-58bb5adbd918	you	possessive	{"russian": "про тебя́", "armenian": "քո մասին", "transcription": "k'o masín"}	about
b704f32b-c56f-4f86-ac6e-e64ae30c997e	you	possessive	{"russian": "вместо тебя́", "armenian": "քո փոխարեն", "transcription": "k'o p'okharen"}	instead
ca87b473-9b46-49fe-b930-72b93c4510f6	you	possessive	{"russian": "под тобóй", "armenian": "քո տակ", "transcription": "k'o tak"}	under
ad1594e7-7432-48cb-8014-56a089ae0e1d	you	possessive	{"russian": "в тебé", "armenian": "քո մեջ", "transcription": "k'o metch"}	in
31e0ed4b-e58f-473b-bfcd-fc134c5065e7	you	possessive	{"russian": "между тобóй и мнóй", "armenian": "իմ ու քո միջև", "transcription": "im u k'o michév"}	between
79b078c5-8269-406f-a8f1-55828362e023	you	possessive	{"comment": {"russian": "по причине"}, "russian": "из-за тебя", "armenian": "քո պատճառով", "transcription": "k'o patjarov"}	because-of
4f385ae8-d25a-4a4c-8db8-c3ecadc706b2	you	possessive	{"russian": "как ты", "armenian": "քո նման/պես", "informal": "", "transcription": "k'o nman/pes"}	like
\.
COPY public.question (id, comment, description) FROM stdin;
what	{}	{}
who	{}	{}
where	{}	{}
where-to	{}	{}
when	{}	{}
which	{}	{}
why	{}	{}
what-kind-of	{}	{}
how-many	{"russian": "исчисляемое"}	{}
how-much	{"russian": "неисчисляемое"}	{}
what-time	{"russian": "времени"}	{}
\.
COPY public.question_case (id, question_id, case_id, single, plural, comment) FROM stdin;
79378249-226a-4645-8446-20e876033e57	what	nominative	{"russian": "что", "armenian": "ի՞նչ", "transcription": "inch"}	{"russian": "что", "armenian": "ինչե՞ր", "transcription": "inchér"}	{}
fd0e3e0e-2897-4f75-8b0e-bc343fb2f197	what	possessive	{"russian": "чегó", "armenian": "ինչի՞", "transcription": "inchí"}	{"russian": "чегó", "armenian": "ինչերի՞", "transcription": "incherí"}	{}
f2034459-3d07-4641-bd1d-10939d2df0cb	who	nominative	{"russian": "кто", "armenian": "ո՞վ", "transcription": "ov"}	{"russian": "кто", "armenian": "ովքե՞ր", "transcription": "ovk'ér"}	{}
7f61277f-f0e7-419a-b4a3-f635119f47e1	who	possessive	{"russian": "чей", "armenian": "ո՞ւմ", "transcription": "um"}	{}	{}
fe997f06-69d3-4985-851b-02e07a46a9b8	where	nominative	{"russian": "где", "armenian": "որտե՞ղ", "transcription": "vortégh"}	{}	{}
c96acee9-e54e-46ff-8089-549ad808fd71	where	possessive	{"comment": {"russian": "из какого места/региона"}, "russian": "откуда", "armenian": "որտեղի՞", "transcription": "vorteghí"}	{}	{}
665cd135-9383-4943-b03d-c5433985b8c9	where-to	nominative	{"russian": "куда", "armenian": "ո՞ւր", "transcription": "ur"}	{}	{}
eae01da8-7a48-484f-8c82-fa15d8745714	when	nominative	{"russian": "когда́", "armenian": "ե՞րբ", "transcription": "yerb"}	{}	{}
b0dde583-f9a4-49f1-86b2-71578b65d9ca	when	possessive	{"russian": "какóго времени", "armenian": "երբվա՞", "transcription": "yerbvá"}	{}	{}
cb93fc28-81c0-4a07-a54d-bf32106de3f3	which	nominative	{"russian": "котóрый", "armenian": "ո՞ր", "transcription": "vor"}	{}	{}
d6994231-e30d-4b3b-97a4-bc223da3a8df	which	possessive	{"russian": "котóрого", "armenian": "որի՞", "transcription": "vorí"}	{}	{}
e12f1ac1-17a6-481f-8c07-f835bd1bed28	why	nominative	{"russian": "почему́", "armenian": "ինչո՞ւ", "transcription": "inchú"}	{"comment": {"russian": "существительное"}, "russian": "(тысяча) почему́", "armenian": "ինչուներ", "transcription": "inchunér"}	{}
94cefd3d-6316-44d0-a18d-6dd8f972f0b7	how-many	nominative	{"russian": "скóлько", "armenian": "քանի՞", "transcription": "k'aní"}	{}	{}
010dd7e8-1c15-418a-9647-42bdc7004db6	how-much	nominative	{"russian": "скóлько", "armenian": "ինչքա՞ն", "transcription": "inchk'án"}	{}	{}
b473b8b1-ec2f-47f2-97ef-7afd860ec3c5	how-much	possessive	{"comment": {"russian": "на сколько положить"}, "russian": "на скóлько", "armenian": "ինչքանի՞", "transcription": "inchk'aní"}	{}	{}
7efda1fc-226e-497b-9b5e-f9eecdc47d29	what-kind-of	nominative	{"russian": "какóй", "armenian": "ինչպիսի՞", "transcription": "inchpisí"}	{}	{}
208464f5-17ea-4b54-bef6-a6caf1b047e3	what-time	nominative	{"russian": "скóлько", "armenian": "քանի՞ս", "transcription": "k'anís"}	{}	{}
c12ec1c2-97e5-4d9f-80f2-3ea1e994cb7f	what-time	possessive	{"russian": "скóлько", "armenian": "քանիսի՞", "transcription": "k'anisí"}	{}	{}
1d99c011-ac20-4654-a043-d1d1af11ecb9	what	instrumental	{"russian": "чем", "armenian": "ինչո՞վ", "transcription": "inchov"}	{"russian": "чем", "armenian": "ինչերո՞վ", "transcription": "inchov"}	{}
\.
COPY public.question_case_example (id, question_id, case_id, example, prepostposition_id) FROM stdin;
b9de09f1-8033-4d55-b662-3b1c7c1c8019	where	possessive	{"russian": "Какого региона вино?", "armenian": "Որտեղի՞ գինի է։"}	\N
6060ac0c-63f7-4804-828c-42b2e4a8cee9	what-time	possessive	{"russian": "К какому времени приготовить стол?", "armenian": "Ժամը քանիս*ի՞* համար եք սեղան ուզում։"}	for
\.
