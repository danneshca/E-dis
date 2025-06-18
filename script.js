document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.querySelector('.submit-button');
    const textarea = document.querySelector('.input-section textarea');
    const saveToVocabCheckbox = document.querySelector('.save-to-vocab input[type="checkbox"]');
    const languageSelect = document.querySelector('.language-select select');
    const markdownDisplay = document.getElementById('markdown-display');
    const outputSidebar = document.querySelector('.output-sidebar'); // Get the output sidebar
    const themeToggleButton = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; // Get the <html> element

    // View sections
    const inputSection = document.querySelector('.input-section');
    const vocabListSection = document.querySelector('.vocab-list-section');
    const vocabItemsContainer = document.getElementById('vocab-items-container');

    // Sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const translateLink = Array.from(navLinks).find(a => a.textContent.trim() === '翻译');
    const vocabLink = Array.from(navLinks).find(a => a.textContent.trim() === '生词本');

    // Coze API Details
    const cozeWorkflowId = '7505413450131554319';
    const cozeApiKey = 'pat_5igwYkWxCIPOGIxNiOJEC2y4ek0BtDoAB3RQFjcfhhTfBCc7SvG25WLoS1dOi3fB';
    const cozeApiUrl = 'https://api.coze.cn/v1/workflow/run';

    // New Coze Workflow IDs for Vocabulary
    const getAllVocabWorkflowId = '7505442251197186102';
    const getMeaningWorkflowId = '7505438624844398626';
    const deleteVocabWorkflowId = '7505437212633268261';

    // New Coze Workflow ID for playing audio
    const playAudioWorkflowId = '7505732361524248628';

    // Theme-related variables and functions
    const themes = ['light', 'dark', 'colorful', 'pinkblue'];
    const themeButtonLabels = {
        light: '切换深色模式',
        dark: '切换彩色模式',
        colorful: '切换粉蓝模式',
        pinkblue: '切换浅色模式'
    };

    // Function to apply theme based on preference
    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        if (themeToggleButton) {
            themeToggleButton.textContent = themeButtonLabels[theme] || '切换主题';
        }
    }

    // Function to toggle theme and save preference
    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme') || themes[0];
        let currentIndex = themes.indexOf(currentTheme);
        currentIndex = (currentIndex + 1) % themes.length; // Cycle to the next theme
        const newTheme = themes[currentIndex];
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }

    // Event listener for the theme toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    // On page load, apply saved theme or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes.includes(savedTheme)) {
        applyTheme(savedTheme);
    } else {
        applyTheme(themes[0]); // Default to the first theme in the array (light)
    }

    // Function to switch views
    function switchToView(viewToShow) {
        inputSection.style.display = 'none';
        vocabListSection.style.display = 'none';
        markdownDisplay.innerHTML = ''; // Clear right panel
        outputSidebar.style.display = 'flex'; // Ensure output sidebar is visible for both views initially

        if (viewToShow === 'translate') {
            inputSection.style.display = 'flex'; // or 'block' depending on its original display type
            translateLink.parentElement.classList.add('active');
            vocabLink.parentElement.classList.remove('active');
        } else if (viewToShow === 'vocab') {
            vocabListSection.style.display = 'block'; // or 'flex'
            vocabLink.parentElement.classList.add('active');
            translateLink.parentElement.classList.remove('active');
            loadAndDisplayVocabList(); // Call function to load vocab list
        }
    }

    if (translateLink) {
        translateLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchToView('translate');
        });
    }

    if (vocabLink) {
        vocabLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchToView('vocab');
        });
    }

    // 用户认证相关变量
    const authModal = document.getElementById('auth-modal');
    const authTitle = document.getElementById('auth-title');
    const authForm = document.getElementById('auth-form');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');
    const loginSection = document.getElementById('login-section');
    const usernameDisplay = document.getElementById('username-display');
    const authTabs = document.querySelectorAll('.auth-tab');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const closeButton = document.querySelector('.close-button');

    // Notification Modal Elements
    const notificationModal = document.getElementById('notification-modal');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationCloseButton = document.getElementById('notification-close-button');
    const notificationOkButton = document.getElementById('notification-ok-button');

    // 用户认证状态
    let currentUser = null;
    let isRegisterMode = false;

    // 检查本地存储中的用户信息
    function checkUserSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
        }
    }

    // 更新UI以显示已登录用户
    function updateUIForLoggedInUser() {
        if (currentUser) {
            usernameDisplay.textContent = currentUser.username;
            userInfo.style.display = 'block';
            loginSection.style.display = 'none';
        } else {
            userInfo.style.display = 'none';
            loginSection.style.display = 'block';
        }
    }

    // 显示认证模态框
    function showAuthModal() {
        authModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 隐藏认证模态框
    function hideAuthModal() {
        authModal.style.display = 'none';
        document.body.style.overflow = '';
        authForm.reset();
        isRegisterMode = false;
        updateAuthUI();
    }

    // 更新认证UI
    function updateAuthUI() {
        authTitle.textContent = isRegisterMode ? '注册' : '登录';
        confirmPasswordGroup.style.display = isRegisterMode ? 'block' : 'none';
        authTabs.forEach(tab => {
            if (tab.dataset.tab === (isRegisterMode ? 'register' : 'login')) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // 切换登录/注册模式
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            isRegisterMode = tab.dataset.tab === 'register';
            updateAuthUI();
        });
    });

    // 关闭按钮事件
    closeButton.addEventListener('click', hideAuthModal);

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        // 只处理通知模态框的外部点击关闭
        if (notificationModal && e.target === notificationModal) {
            hideNotificationModal();
        }
        // 不再处理 authModal (登录/注册弹窗) 的外部点击关闭
        // if (e.target === authModal) {
        //     hideAuthModal();
        // }
    });

    // 登录按钮事件
    loginButton.addEventListener('click', showAuthModal);

    // 退出登录事件
    logoutButton.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForLoggedInUser();
        showNotificationModal('您已成功退出登录。');
    });

    // 显示自定义通知模态框
    function showNotificationModal(message, title = '提示') {
        if (notificationModal && notificationTitle && notificationMessage) {
            notificationTitle.textContent = title;
            notificationMessage.textContent = message;
            notificationModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            // Fallback to alert if modal elements are not found for some reason
            alert(message);
        }
    }

    // 隐藏自定义通知模态框
    function hideNotificationModal() {
        if (notificationModal) {
            notificationModal.style.display = 'none';
            document.body.style.overflow = ''; // Restore background scrolling
        }
    }

    // 为通知模态框的关闭和确定按钮添加事件监听器
    if (notificationCloseButton) {
        notificationCloseButton.addEventListener('click', hideNotificationModal);
    }
    if (notificationOkButton) {
        notificationOkButton.addEventListener('click', hideNotificationModal);
    }

    // 处理表单提交
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (isRegisterMode && password !== confirmPassword) {
            showNotificationModal('两次输入的密码不一致');
            return;
        }

        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    workflow_id: isRegisterMode ? '7506154953607970870' : '7506048204979421211', // 更新注册及登录工作流ID
                    parameters: {
                        username,
                        password
                    }
                })
            });

            const result = await response.json();

            if (result.code === 0 && result.data) {
                const workflowOutput = JSON.parse(result.data); 

                if (isRegisterMode) {
                    // 处理注册逻辑
                    if (workflowOutput.output === true) {
                        showNotificationModal('注册成功！现在您可以登录了。', '注册成功');
                        authForm.reset(); // 清空表单
                        isRegisterMode = false; // 切换回登录模式
                        updateAuthUI(); // 更新UI以显示登录标签为激活
                    } else {
                        // output === false 或者 output 未定义等情况
                        showNotificationModal('注册失败，用户名已被占用', '注册失败');
                    }
                } else {
                    // 处理登录逻辑 (基本保持不变，依赖 workflowOutput.success 和 workflowOutput.uuid)
                    if (workflowOutput.success) {
                        currentUser = {
                            username, 
                            token: workflowOutput.uuid 
                        };
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        updateUIForLoggedInUser();
                        hideAuthModal();
                        if (vocabListSection.style.display !== 'none') {
                            loadAndDisplayVocabList();
                        }
                    } else {
                        showNotificationModal(workflowOutput.message || '登录失败，请检查您的用户名和密码。', '登录失败');
                    }
                }
            } else {
                showNotificationModal('认证请求失败，请稍后重试。', '认证错误');
            }
        } catch (error) {
            console.error('认证错误:', error);
            showNotificationModal('发生错误，请稍后重试。', '操作异常');
        }
    });

    // Placeholder for loadAndDisplayVocabList - will be implemented next
    async function loadAndDisplayVocabList() {
        if (!currentUser) {
            showNotificationModal('请先登录才能查看生词本。', '提示');
            return;
        }

        vocabItemsContainer.innerHTML = '<p class="loading-message">正在加载生词列表...</p>';
        markdownDisplay.innerHTML = '';

        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    workflow_id: getAllVocabWorkflowId,
                    parameters: {
                        input_id: currentUser.username
                    }
                })
            });

            const result = await response.json();

            if (result.code === 0 && result.data) {
                const workflowOutput = JSON.parse(result.data);
                vocabItemsContainer.innerHTML = ''; 

                if (workflowOutput.output && Array.isArray(workflowOutput.output) && workflowOutput.output.length > 0) {
                    workflowOutput.output.forEach(item => {
                        if (item && typeof item.word === 'string') {
                            const word = item.word;
                            const vocabItemDiv = document.createElement('div');
                            vocabItemDiv.classList.add('vocab-item');

                            const wordSpan = document.createElement('span');
                            wordSpan.classList.add('vocab-item-word');
                            wordSpan.textContent = word;

                            const buttonsDiv = document.createElement('div');
                            buttonsDiv.classList.add('vocab-item-buttons');

                            const meaningButton = document.createElement('button');
                            meaningButton.classList.add('vocab-button', 'meaning-button');
                            meaningButton.innerHTML = '📖';
                            meaningButton.title = '查看释义';
                            meaningButton.addEventListener('click', () => showMeaning(word));

                            const quizButton = document.createElement('button');
                            quizButton.classList.add('vocab-button', 'quiz-button');
                            quizButton.innerHTML = '✍️';
                            quizButton.title = '小测验';
                            quizButton.addEventListener('click', () => showQuizInterface(word));

                            const playAudioButton = document.createElement('button');
                            playAudioButton.classList.add('vocab-button', 'play-audio-button');
                            playAudioButton.innerHTML = '🔊';
                            playAudioButton.title = `播放 "${word}" 发音`;
                            playAudioButton.addEventListener('click', (e) => {
                                e.stopPropagation();
                                playWordAudio(word, playAudioButton);
                            });

                            const deleteButton = document.createElement('button');
                            deleteButton.classList.add('vocab-button', 'delete-button');
                            deleteButton.innerHTML = '🗑️';
                            deleteButton.title = '删除单词';
                            deleteButton.addEventListener('click', () => deleteWord(word, vocabItemDiv));

                            buttonsDiv.appendChild(meaningButton);
                            buttonsDiv.appendChild(quizButton);
                            buttonsDiv.appendChild(playAudioButton);
                            buttonsDiv.appendChild(deleteButton);

                            vocabItemDiv.appendChild(wordSpan);
                            vocabItemDiv.appendChild(buttonsDiv);
                            vocabItemsContainer.appendChild(vocabItemDiv);
                        }
                    });
                } else {
                    vocabItemsContainer.innerHTML = '<p class="empty-message">生词本是空的。</p>';
                }
            } else {
                console.error('Error fetching vocab list:', result);
                vocabItemsContainer.innerHTML = '<p class="error-message">加载生词列表失败。请稍后重试。</p>';
                if (result.debug_url) {
                    console.log(`Vocab list fetch debug URL: ${result.debug_url}`);
                    vocabItemsContainer.innerHTML += `<p class="debug-link-message">调试链接: <a href="${result.debug_url}" target="_blank">查看详情</a></p>`;
                }
            }
        } catch (error) {
            console.error('JS Error fetching vocab list:', error);
            vocabItemsContainer.innerHTML = '<p class="error-message">加载生词列表时发生错误。</p>';
        }
    }

    async function showMeaning(word) {
        markdownDisplay.innerHTML = '<p class="loading-message">正在加载释义...</p>';
        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({ 
                    workflow_id: getMeaningWorkflowId, 
                    parameters: { input: word } 
                })
            });
            const result = await response.json();

            if (result.code === 0 && result.data) {
                const workflowOutput = JSON.parse(result.data);
                const meaningMarkdown = workflowOutput.output;
                if (typeof marked !== 'undefined') {
                    markdownDisplay.innerHTML = marked.parse(meaningMarkdown || '');
                } else {
                    markdownDisplay.textContent = meaningMarkdown || '未能获取释义。';
                }
            } else {
                markdownDisplay.innerHTML = '<p class="error-message">无法加载释义。</p>';
                console.error('Error fetching meaning:', result);
                 if (result.debug_url) {
                    markdownDisplay.innerHTML += `<p class="debug-link-message">调试链接: <a href="${result.debug_url}" target="_blank">查看详情</a></p>`;
                }
            }
        } catch (error) {
            console.error('JS Error fetching meaning:', error);
            markdownDisplay.innerHTML = '<p class="error-message">加载释义时发生错误。</p>';
        }
    }

    async function deleteWord(word, listItemElement) {
        if (!currentUser) {
            showNotificationModal('请先登录才能删除单词。', '提示');
            return;
        }

        // 使用自定义确认框替代 confirm
        showConfirmationModal(`确定要从生词本中删除 "${word}" 吗？`, () => {
            deleteWordConfirmed(word, listItemElement);
        });
    }

    async function deleteWordConfirmed(word, listItemElement) {
        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    workflow_id: deleteVocabWorkflowId,
                    parameters: {
                        word,
                        input_id: currentUser.token
                    }
                })
            });
            const result = await response.json();

            if (result.code === 0) { // Assuming success if code is 0, even if no specific data is returned for delete
                listItemElement.remove();
                // Optionally, show a success message in the markdownDisplay area or as a toast
                // markdownDisplay.innerHTML = `<p class="success-message">"${word}" 已成功删除。</p>`;
                // setTimeout(() => { if (markdownDisplay.querySelector('.success-message')) markdownDisplay.innerHTML = ''; }, 3000);
                if (vocabItemsContainer.children.length === 0) {
                    vocabItemsContainer.innerHTML = '<p class="empty-message">生词本是空的。</p>';
                }
            } else {
                showNotificationModal(`删除 "${word}" 失败: ${result.msg || '未知错误'}`, '删除失败');
                console.error('Error deleting word:', result);
                // Re-enable button if optimistic UI was used
                // listItemElement.style.opacity = '1';
                // listItemElement.querySelector('.delete-button').disabled = false;
            }
        } catch (error) {
            console.error('JS Error deleting word:', error);
            showNotificationModal(`删除 "${word}" 时发生错误。`, '操作异常');
            // Re-enable button if optimistic UI was used
            // listItemElement.style.opacity = '1';
            // listItemElement.querySelector('.delete-button').disabled = false;
        }
    }

    function showQuizInterface(word) {
        markdownDisplay.innerHTML = ''; 
        outputSidebar.style.display = 'flex'; 

        const quizContainer = document.createElement('div');
        quizContainer.classList.add('quiz-interface-container');

        const instruction = document.createElement('p');
        instruction.classList.add('quiz-instruction');
        instruction.textContent = `用单词 "${word}" 造一个句子：`;

        const sentenceTextarea = document.createElement('textarea');
        sentenceTextarea.classList.add('quiz-sentence-textarea');
        sentenceTextarea.placeholder = '在此输入您的句子...';

        const submitQuizButton = document.createElement('button');
        submitQuizButton.classList.add('submit-button', 'quiz-submit-button');
        submitQuizButton.textContent = '提交句子检查';

        quizContainer.appendChild(instruction);
        quizContainer.appendChild(sentenceTextarea);
        quizContainer.appendChild(submitQuizButton);
        markdownDisplay.appendChild(quizContainer);

        // Find the corresponding vocabItemDiv to pass for potential deletion
        let vocabItemDivForDeletion = null;
        const vocabItems = vocabItemsContainer.querySelectorAll('.vocab-item');
        vocabItems.forEach(item => {
            const wordSpan = item.querySelector('.vocab-item-word');
            if (wordSpan && wordSpan.textContent === word) {
                vocabItemDivForDeletion = item;
            }
        });

        submitQuizButton.addEventListener('click', async () => {
            const sentence = sentenceTextarea.value.trim();
            if (!sentence) {
                showNotificationModal('请输入您造的句子！', '提示');
                return;
            }
            submitQuizButton.disabled = true;
            submitQuizButton.textContent = '正在检查...';
            sentenceTextarea.disabled = true;

            await submitSentenceForQuiz(word, sentence, vocabItemDivForDeletion); // Pass the div
        });
    }

    async function submitSentenceForQuiz(word, sentence, vocabItemDiv) { // Added vocabItemDiv
        const quizWorkflowId = '7505634935849205760';
        const params = {
            input_word: word,
            input_sentence: sentence
        };

        let feedbackMarkdown = ''; // Store markdown to display before adding buttons
        let apiSuccess = false;
        let debugUrl = null;

        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    workflow_id: quizWorkflowId,
                    parameters: params
                })
            });
            const result = await response.json();
            debugUrl = result.debug_url;

            if (result.code === 0 && result.data) {
                const workflowOutput = JSON.parse(result.data);
                feedbackMarkdown = workflowOutput.output || '未能获取小测结果。';
                apiSuccess = true;
            } else {
                feedbackMarkdown = '<p class="error-message">无法加载小测结果。</p>';
                console.error('Error submitting quiz sentence:', result);
                if (debugUrl) {
                    feedbackMarkdown += `<p class="debug-link-message">调试链接: <a href="${debugUrl}" target="_blank">查看详情</a></p>`;
                }
            }
        } catch (error) {
            console.error('JS Error submitting quiz sentence:', error);
            feedbackMarkdown = '<p class="error-message">提交小测时发生错误。</p>';
        }
        
        markdownDisplay.innerHTML = ''; // Clear the quiz interface or previous message

        if (typeof marked !== 'undefined') {
            markdownDisplay.innerHTML = marked.parse(feedbackMarkdown);
        } else {
            markdownDisplay.textContent = feedbackMarkdown; // Fallback for raw text, though should not happen if Marked.js is loaded
        }

        // Add Keep/Remove buttons only if the API call was successful in some form (even if Coze returned an error handled as markdown)
        // Or, more specifically, if we want to offer removal even if feedback failed, this condition might change.
        // For now, let's assume we only offer this if feedback was potentially displayed.
        // if (apiSuccess) { // Or simply always add them if a quiz attempt was made.
        const controlsContainer = document.createElement('div');
        controlsContainer.classList.add('quiz-result-controls');

        const keepButton = document.createElement('button');
        keepButton.classList.add('vocab-button', 'keep-vocab-button');
        keepButton.textContent = '保留生词';
        keepButton.addEventListener('click', () => {
            controlsContainer.remove(); // Just remove the controls
        });

        const removeButton = document.createElement('button');
        removeButton.classList.add('vocab-button', 'delete-button', 'remove-after-quiz-button'); // Reuse delete-button styles if appropriate
        removeButton.textContent = '移除生词';
        removeButton.addEventListener('click', () => {
            if (vocabItemDiv) { // Ensure the div exists before trying to remove
                deleteWord(word, vocabItemDiv); // Call existing delete function
            }
            controlsContainer.remove();
            // Optionally clear the markdown display or show a message like "Word removed"
            // markdownDisplay.innerHTML = '<p class="success-message">单词已移除。</p>';
        });

        controlsContainer.appendChild(keepButton);
        controlsContainer.appendChild(removeButton);
        markdownDisplay.appendChild(controlsContainer);
        // }
    }

    async function playWordAudio(word, buttonElement) {
        const globalAudioPlayerId = 'global-audio-player-instance';
        let originalButtonContent = '';

        if (buttonElement) {
            buttonElement.disabled = true;
            originalButtonContent = buttonElement.innerHTML; // Store original HTML content
            buttonElement.innerHTML = '⏳'; // Loading emoji
        }

        // Stop and remove any existing audio player
        let existingAudioPlayer = document.getElementById(globalAudioPlayerId);
        if (existingAudioPlayer) {
            existingAudioPlayer.pause();
            existingAudioPlayer.src = ''; // Detach source
            existingAudioPlayer.load(); // Abort current network request
            existingAudioPlayer.remove();
        }

        try {
            const response = await fetch(cozeApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cozeApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    workflow_id: playAudioWorkflowId,
                    parameters: { input: word }
                })
            });
            const result = await response.json();

            if (result.code === 0 && result.data) {
                const workflowOutput = JSON.parse(result.data);
                const audioUrl = workflowOutput.output;

                if (audioUrl) {
                    const audioPlayer = document.createElement('audio');
                    audioPlayer.id = globalAudioPlayerId;
                    audioPlayer.src = audioUrl;
                    // audioPlayer.style.display = 'none'; // Not strictly necessary to hide

                    audioPlayer.play()
                        .then(() => {
                            if (buttonElement) {
                                buttonElement.innerHTML = '🎶'; // Playing emoji
                            }
                        })
                        .catch(e => {
                            console.error(`播放 "${word}" 的音频失败: ${e.message}`);
                            if (buttonElement) {
                                buttonElement.innerHTML = originalButtonContent;
                                buttonElement.disabled = false;
                            }
                            audioPlayer.remove(); // Clean up failed player
                        });

                    audioPlayer.onended = () => {
                        if (buttonElement) {
                            buttonElement.innerHTML = originalButtonContent;
                            buttonElement.disabled = false;
                        }
                        audioPlayer.remove(); // Clean up after playing
                    };

                    audioPlayer.onerror = (e) => {
                        console.error(`Error loading audio for "${word}":`, e, `URL: ${audioPlayer.src}`);
                        if (buttonElement) {
                            buttonElement.innerHTML = originalButtonContent; // Restore original content
                            buttonElement.disabled = false;
                        }
                        audioPlayer.remove(); // Clean up errored player
                    };
                    // Append to body to ensure it's part of the document, some browsers might need this for events.
                    // document.body.appendChild(audioPlayer); 
                    // It seems appending is not always necessary if play() is called directly.
                    // If issues arise on specific browsers, this could be a point to revisit.

                } else {
                    showNotificationModal(`未能获取 "${word}" 的音频链接 (无输出)。`, '音频获取失败');
                    if (buttonElement) {
                        buttonElement.innerHTML = originalButtonContent;
                        buttonElement.disabled = false;
                    }
                }
            } else {
                showNotificationModal(`请求 "${word}" 的音频失败: ${result.msg || '未知API错误'}`, 'API错误');
                console.error('Error fetching audio URL from Coze:', result);
                if (buttonElement) {
                    buttonElement.innerHTML = originalButtonContent;
                    buttonElement.disabled = false;
                }
            }
        } catch (error) {
            console.error(`JS Error in playWordAudio for "${word}":`, error);
            if (buttonElement) {
                buttonElement.innerHTML = originalButtonContent;
                buttonElement.disabled = false;
            }
        }
    }

    if (submitButton && textarea && saveToVocabCheckbox && languageSelect && markdownDisplay) {
        submitButton.addEventListener('click', async () => {
            // 首先检查用户是否登录
            if (!currentUser) {
                showNotificationModal('请先登录后再使用翻译功能。', '需要登录');
                return; // 阻止后续操作
            }

            const tranlate_src = textarea.value;
            const saveToDB = saveToVocabCheckbox.checked;
            const tranlate_to = languageSelect.value;

            if (!tranlate_src.trim()) {
                showNotificationModal('请输入想要翻译和拆解的内容！', '提示');
                return;
            }

            if (saveToDB && !currentUser) {
                showNotificationModal('请先登录后再保存到生词本。', '提示');
                return;
            }

            markdownDisplay.textContent = '正在调用工作流，请稍候...';

            const requestBody = {
                workflow_id: cozeWorkflowId,
                parameters: {
                    tranlate_src,
                    saveToDB: String(saveToDB),
                    tranlate_to,
                    input_id: currentUser ? currentUser.username : null
                }
            };

            try {
                const response = await fetch(cozeApiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cozeApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    },
                    body: JSON.stringify(requestBody)
                });

                const result = await response.json();

                if (result.code === 0 && result.data) {
                    try {
                        const workflowOutput = JSON.parse(result.data);
                        const outputc = workflowOutput.outputc || '';
                        const outpute = workflowOutput.outpute || '';

                        let markdownText = '';
                        if (outputc) {
                            markdownText += `### 中文翻译/解释:\n${outputc}\n\n`;
                        }
                        if (outpute) {
                            markdownText += `### 英文词根/相关:\n${outpute}\n`;
                        }

                        if (!outputc && !outpute) {
                            markdownText = '未能从工作流获取到有效的输出 (outputc 或 outpute)。';
                        }

                        if (typeof marked !== 'undefined') {
                            markdownDisplay.innerHTML = marked.parse(markdownText.trim());
                        } else {
                            console.warn('Marked.js library not found. Displaying raw Markdown.');
                            markdownDisplay.textContent = markdownText.trim();
                        }

                        // Add audio play button for the searched word if applicable
                        const potentialWordToPlay = tranlate_src.trim();
                        // Check if translating to Chinese and source is likely English
                        const isTranslatingToChinese = tranlate_to === 'zh';
                        const containsEnglishChars = /[a-zA-Z]/.test(potentialWordToPlay);

                        if (isTranslatingToChinese && containsEnglishChars && (outputc || outpute) && potentialWordToPlay.length > 0) {
                            const audioPlaybackContainer = document.createElement('div');
                            audioPlaybackContainer.style.marginTop = '20px'; // Add some space above
                            audioPlaybackContainer.style.marginBottom = '10px'; // And below
                            audioPlaybackContainer.style.textAlign = 'center';

                            const playMainWordButton = document.createElement('button');
                            playMainWordButton.classList.add('vocab-button'); // Base style, but will be overridden
                            playMainWordButton.innerHTML = `🔊 播放 "${potentialWordToPlay}"`;
                            playMainWordButton.title = `播放 "${potentialWordToPlay}" 的发音`;
                            
                            // Override some vocab-button styles for this specific button
                            playMainWordButton.style.width = 'auto';
                            playMainWordButton.style.height = 'auto';
                            playMainWordButton.style.padding = '10px 20px';
                            playMainWordButton.style.borderRadius = 'var(--border-radius-interactive)'; // More rectangular
                            playMainWordButton.style.fontSize = '0.95rem'; // Adjust font size
                            playMainWordButton.style.lineHeight = 'normal'; // Default line height for text

                            playMainWordButton.addEventListener('click', () => playWordAudio(potentialWordToPlay, playMainWordButton));
                            
                            audioPlaybackContainer.appendChild(playMainWordButton);
                            markdownDisplay.appendChild(audioPlaybackContainer); // Append to markdownDisplay content
                        }

                        // Add audio play button for the translated English output if applicable (Chinese to English)
                        const singleWordRegex = /^[a-zA-Z]+(?:[\'-]?[a-zA-Z]+)*$/;
                        console.log("[DEBUG] Ch-En Translate: ====== 开始处理中译英音频按钮 ======");
                        console.log("[DEBUG] Ch-En Translate: 原始输出 (outpute):", outpute);
                        console.log("[DEBUG] Ch-En Translate: outpute 类型:", typeof outpute);
                        
                        let extractedWords = [];
                        if (outpute && typeof outpute === 'string') {
                            console.log("[DEBUG] Ch-En Translate: 开始提取英文单词");
                            // 尝试从outpute中提取英文单词
                            // 首先尝试查找"翻译"标记
                            const translationMarker = "**翻译**";
                            const markerIndex = outpute.indexOf(translationMarker);
                            console.log("[DEBUG] Ch-En Translate: 查找翻译标记结果:", markerIndex !== -1 ? "找到" : "未找到");
                            
                            let extractedText = '';
                            if (markerIndex !== -1) {
                                // 如果找到"翻译"标记，提取后面的内容
                                const substringAfterMarker = outpute.substring(markerIndex + translationMarker.length);
                                console.log("[DEBUG] Ch-En Translate: 标记后的内容:", substringAfterMarker);
                                const brTagIndex = substringAfterMarker.indexOf("<br>");
                                if (brTagIndex !== -1) {
                                    extractedText = substringAfterMarker.substring(0, brTagIndex).trim();
                                } else {
                                    extractedText = substringAfterMarker.trim();
                                }
                                // 分割所有单词
                                extractedWords = extractedText.split(/[;,]/).map(word => word.trim()).filter(word => word);
                                console.log("[DEBUG] Ch-En Translate: 提取的单词数组:", extractedWords);
                            } else {
                                // 如果没有找到"翻译"标记，尝试直接提取所有英文单词
                                console.log("[DEBUG] Ch-En Translate: 尝试直接提取英文单词");
                                const words = outpute.split(/\s+/);
                                console.log("[DEBUG] Ch-En Translate: 分割后的单词数组:", words);
                                extractedWords = words.filter(word => singleWordRegex.test(word));
                                console.log("[DEBUG] Ch-En Translate: 找到符合的单词:", extractedWords);
                            }
                            
                            // 为每个有效的英文单词创建播放按钮
                            if (extractedWords.length > 0) {
                                const audioButtonsContainer = document.createElement('div');
                                audioButtonsContainer.style.marginTop = '20px';
                                audioButtonsContainer.style.marginBottom = '10px';
                                audioButtonsContainer.style.textAlign = 'center';
                                audioButtonsContainer.style.display = 'flex';
                                audioButtonsContainer.style.flexWrap = 'wrap';
                                audioButtonsContainer.style.gap = '10px';
                                audioButtonsContainer.style.justifyContent = 'center';

                                extractedWords.forEach(word => {
                                    if (singleWordRegex.test(word)) {
                                        const playButton = document.createElement('button');
                                        playButton.classList.add('vocab-button');
                                        playButton.innerHTML = `🔊 播放 "${word}"`;
                                        playButton.title = `播放 "${word}" 的发音`;

                                        playButton.style.width = 'auto';
                                        playButton.style.height = 'auto';
                                        playButton.style.padding = '10px 20px';
                                        playButton.style.borderRadius = 'var(--border-radius-interactive)';
                                        playButton.style.fontSize = '0.95rem';
                                        playButton.style.lineHeight = 'normal';

                                        playButton.addEventListener('click', () => playWordAudio(word, playButton));
                                        audioButtonsContainer.appendChild(playButton);
                                    }
                                });

                                if (audioButtonsContainer.children.length > 0) {
                                    markdownDisplay.appendChild(audioButtonsContainer);
                                    console.log("[DEBUG] Ch-En Translate: 播放按钮已添加");
                                }
                            } else {
                                console.log("[DEBUG] Ch-En Translate: 未找到有效的英文单词");
                            }
                        } else {
                            console.log("[DEBUG] Ch-En Translate: 不满足处理条件 - outpute 存在:", !!outpute);
                            console.log("[DEBUG] Ch-En Translate: outpute 类型为字符串:", typeof outpute === 'string');
                        }

                        if (result.debug_url) {
                            console.log(`Workflow debug URL: ${result.debug_url}`);
                        }

                    } catch (e) {
                        console.error('Error parsing workflow data:', e);
                        markdownDisplay.textContent = `处理结果时出错：解析工作流返回的 data 失败。详情请查看控制台。\n原始返回 data: ${result.data}`;
                        if (result.debug_url) {
                            markdownDisplay.textContent += `\n调试链接: ${result.debug_url}`;
                        }
                    }
                } else {
                    // Handle API error or no data
                    console.error('API Error or no data:', result);
                    let errorMessage = `API 请求失败或未返回数据。`;
                    if (result.msg) {
                        errorMessage += `\n错误信息: ${result.msg}`;
                    }
                    if (result.code) {
                        errorMessage += `\n错误代码: ${result.code}`;
                    }
                    if (result.debug_url) {
                        errorMessage += `\n调试链接: ${result.debug_url}`;
                    }
                    if (!response.ok) { // HTTP level error
                         errorMessage += `\nHTTP 状态: ${response.status} ${response.statusText}`;
                    }
                    markdownDisplay.textContent = errorMessage;
                }
            } catch (error) {
                console.error('Fetch Error:', error);
                markdownDisplay.textContent = `请求过程中发生 JavaScript 错误: ${error.message}`;
            }
        });
    } else {
        // This block helps diagnose if selectors are failing
        console.error('Script.js Error: One or more essential DOM elements for the Coze workflow functionality were not found. Please check your HTML structure and selectors in script.js.');
        if (!submitButton) console.error('- Submit button (.submit-button) not found.');
        if (!textarea) console.error('- Textarea (.input-section textarea) not found.');
        if (!saveToVocabCheckbox) console.error('- Save to vocab checkbox (.save-to-vocab input[type="checkbox"]) not found.');
        if (!languageSelect) console.error('- Language select (.language-select select) not found.');
        if (!markdownDisplay) console.error('- Markdown display area (#markdown-display) not found.');
        showNotificationModal('页面初始化错误，部分功能可能无法使用。请检查控制台获取详细信息。', '初始化错误');
    }

    // Initialize to translate view
    switchToView('translate'); 

    // 初始化时检查用户会话
    checkUserSession();

    // --- Custom Confirmation Modal (替代 confirm()) ---
    const confirmationModal = document.getElementById('confirmation-modal'); // 需要在HTML中定义
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');
    let confirmCallback = null;

    function showConfirmationModal(message, callback) {
        // 首先，确保HTML中有对应的模态框结构，类似于 notification-modal
        // <div id="confirmation-modal" class="modal" style="display: none;">
        //     <div class="modal-content">
        //         <div class="modal-body" id="confirmation-message" style="padding: 20px; text-align: center;"></div>
        //         <div class="modal-footer" style="display: flex; justify-content: space-around; padding: 10px 20px;">
        //             <button id="confirm-yes-button" class="submit-button">是</button>
        //             <button id="confirm-no-button" class="theme-toggle-button">否</button>
        //         </div>
        //     </div>
        // </div>
        // 对于这个示例，我将直接使用 showNotificationModal 并调整其行为，
        // 或者您需要添加上述HTML并取消注释以下代码：

        /*
        if (confirmationModal && confirmationMessage && confirmYesButton && confirmNoButton) {
            confirmationMessage.textContent = message;
            confirmCallback = callback;
            confirmationModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            // Fallback to window.confirm if modal elements aren't setup
            if (window.confirm(message)) {
                callback();
            }
        }
        */
       // 简化：暂时用两个通知模拟，或者后续再实现真正的confirm modal
       if (window.confirm(message)) { // 暂时保留 window.confirm
           callback();
       }
    }

    /*
    if (confirmYesButton) {
        confirmYesButton.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            hideConfirmationModal();
        });
    }

    if (confirmNoButton) {
        confirmNoButton.addEventListener('click', () => {
            hideConfirmationModal();
        });
    }

    function hideConfirmationModal() {
        if (confirmationModal) {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = '';
            confirmCallback = null;
        }
    }
    */
    // --- End Custom Confirmation Modal ---
});
