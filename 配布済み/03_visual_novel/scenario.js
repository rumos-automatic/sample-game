// シナリオデータ
const scenarios = {
    start: [
        {
            type: 'bg',
            image: 'school_gate',
            effect: 'fade'
        },
        {
            type: 'text',
            speaker: 'ナレーション',
            text: 'ここは、とある学園。\n新学期が始まり、主人公は転校生として初めて校門をくぐる。'
        },
        {
            type: 'char',
            position: 'center',
            character: '👤',
            name: 'protagonist',
            effect: 'fadeIn'
        },
        {
            type: 'text',
            speaker: '主人公',
            text: '緊張するな...\n転校初日か。'
        },
        {
            type: 'char',
            position: 'right',
            character: '👩‍🎓',
            name: 'student1',
            effect: 'slideIn'
        },
        {
            type: 'text',
            speaker: '女子生徒',
            text: 'あ、もしかして転校生の人？\n私、生徒会の副会長をしている美咲です。'
        },
        {
            type: 'choice',
            choices: [
                {
                    text: 'よろしくお願いします',
                    next: 'polite_route'
                },
                {
                    text: 'そうですが、何か？',
                    next: 'cool_route'
                },
                {
                    text: '美咲さん、可愛いですね',
                    next: 'flirt_route'
                }
            ]
        }
    ],
    
    polite_route: [
        {
            type: 'text',
            speaker: '美咲',
            text: 'こちらこそ！\n案内しますね、教室まで。'
        },
        {
            type: 'char',
            position: 'left',
            character: '👨‍🏫',
            name: 'teacher',
            effect: 'fadeIn'
        },
        {
            type: 'text',
            speaker: '先生',
            text: 'おや、美咲くん。\n新しい転校生を案内してくれているのかな？'
        },
        {
            type: 'text',
            speaker: '美咲',
            text: 'はい、先生。\nちょうど教室に向かうところです。'
        },
        {
            type: 'bg',
            image: 'classroom',
            effect: 'slide'
        },
        {
            type: 'text',
            speaker: 'ナレーション',
            text: '教室に到着した。\nクラスメイトたちの視線が集まる。'
        },
        {
            type: 'char',
            position: 'center',
            character: '👥',
            name: 'classmates',
            effect: 'fadeIn'
        },
        {
            type: 'text',
            speaker: 'クラスメイト達',
            text: 'おお、転校生だ！\nよろしく〜！'
        },
        {
            type: 'choice',
            choices: [
                {
                    text: '自己紹介をする',
                    next: 'introduction'
                },
                {
                    text: '静かに席に着く',
                    next: 'quiet_start'
                }
            ]
        }
    ],
    
    cool_route: [
        {
            type: 'text',
            speaker: '美咲',
            text: 'あ、ごめんなさい。\n急に話しかけて...'
        },
        {
            type: 'text',
            speaker: '主人公',
            text: 'いや、こちらこそ。\n案内してもらえると助かります。'
        },
        {
            type: 'char',
            position: 'left',
            character: '😎',
            name: 'cool_student',
            effect: 'slideIn'
        },
        {
            type: 'text',
            speaker: '謎の生徒',
            text: 'ほう、なかなか面白そうな転校生じゃないか。'
        },
        {
            type: 'text',
            speaker: '美咲',
            text: 'あ、龍也くん...\n彼は学園の問題児なの。気をつけて。'
        },
        {
            type: 'choice',
            choices: [
                {
                    text: '問題児？興味深いな',
                    next: 'rival_route'
                },
                {
                    text: '関わらないようにしよう',
                    next: 'avoid_trouble'
                }
            ]
        }
    ],
    
    flirt_route: [
        {
            type: 'text',
            speaker: '美咲',
            text: 'えっ！？\n///...急に何を言うの...'
        },
        {
            type: 'effect',
            name: 'blush'
        },
        {
            type: 'text',
            speaker: '主人公',
            text: '素直な感想です。\nよろしくお願いします、美咲さん。'
        },
        {
            type: 'text',
            speaker: '美咲',
            text: 'も、もう！\n変な転校生ね...でも、よろしく。'
        },
        {
            type: 'char',
            position: 'left',
            character: '👧',
            name: 'friend',
            effect: 'bounce'
        },
        {
            type: 'text',
            speaker: '美咲の友達',
            text: '美咲〜！\n誰と話してるの？って、転校生！？'
        },
        {
            type: 'choice',
            choices: [
                {
                    text: '美咲さんの友達ですか？',
                    next: 'meet_friend'
                },
                {
                    text: '賑やかな学校ですね',
                    next: 'school_life'
                }
            ]
        }
    ],
    
    introduction: [
        {
            type: 'text',
            speaker: '主人公',
            text: 'はじめまして、今日から転校してきました。\nよろしくお願いします。'
        },
        {
            type: 'text',
            speaker: 'クラスメイト',
            text: '部活は何か入る予定？\nうちのクラスはみんな何かしら入ってるよ！'
        },
        {
            type: 'choice',
            choices: [
                {
                    text: '運動部に興味があります',
                    next: 'sports_club'
                },
                {
                    text: '文化部がいいかな',
                    next: 'culture_club'
                },
                {
                    text: 'まだ決めていません',
                    next: 'undecided'
                }
            ]
        }
    ],
    
    quiet_start: [
        {
            type: 'text',
            speaker: 'ナレーション',
            text: '静かに席に着いた。\n窓際の席から外を眺める。'
        },
        {
            type: 'text',
            speaker: '隣の生徒',
            text: 'やあ、隣の席になったね。\n俺は健太。よろしく！'
        },
        {
            type: 'end',
            text: '～ Chapter 1 完 ～'
        }
    ],
    
    rival_route: [
        {
            type: 'text',
            speaker: '龍也',
            text: '面白い...\n君とは仲良くなれそうだ。'
        },
        {
            type: 'end',
            text: '～ ライバル編へ続く ～'
        }
    ],
    
    avoid_trouble: [
        {
            type: 'text',
            speaker: '主人公',
            text: '（関わらないのが一番だな...）'
        },
        {
            type: 'end',
            text: '～ 平穏な学園生活編へ ～'
        }
    ],
    
    meet_friend: [
        {
            type: 'text',
            speaker: '友達',
            text: 'そうよ！私は由香。\n美咲とは幼馴染なの。'
        },
        {
            type: 'end',
            text: '～ 友情編へ続く ～'
        }
    ],
    
    school_life: [
        {
            type: 'text',
            speaker: '美咲',
            text: 'ええ、とても賑やかよ。\nきっと楽しい学園生活になるわ。'
        },
        {
            type: 'end',
            text: '～ 学園生活編へ ～'
        }
    ],
    
    sports_club: [
        {
            type: 'text',
            speaker: 'クラスメイト',
            text: 'おお！じゃあ一緒にバスケ部見学に行こう！'
        },
        {
            type: 'end',
            text: '～ スポーツ編へ ～'
        }
    ],
    
    culture_club: [
        {
            type: 'text',
            speaker: 'クラスメイト',
            text: '文芸部とか美術部があるよ。\n放課後案内するね！'
        },
        {
            type: 'end',
            text: '～ 文化部編へ ～'
        }
    ],
    
    undecided: [
        {
            type: 'text',
            speaker: 'クラスメイト',
            text: 'ゆっくり決めればいいよ。\n学園を楽しんで！'
        },
        {
            type: 'end',
            text: '～ 自由編へ ～'
        }
    ]
};