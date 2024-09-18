  const floatingButtonRef = useRef(null);

  useEffect(() => {

    
    const floatingButton = floatingButtonRef.current;
    const container = containerRef.current;
    
    if (floatingButton && container && isFloatingVisible) {
      const buttonWidth = 70;
      const buttonHeight = 70;
      const collisionMargin = 5;
      const collisionCooldown = 1000; // Reduced cooldown time

      const updateContainerDimensions = () => {
        const containerRect = container.getBoundingClientRect();
        const maxX = Math.min(containerRect.width - buttonWidth, 390 - buttonWidth);
        const maxY = Math.min(containerRect.height - buttonHeight, 780 - buttonHeight);
        return { maxX, maxY };
      };

      let { maxX, maxY } = updateContainerDimensions();

      let posX = Math.random() * maxX;
      let posY = Math.random() * maxY;
      let speed = 1; // Reduced speed
      let angle = Math.random() * 2 * Math.PI;

      const buttonImages = [
        '/static/images/buttonImages/button1.png',
        '/static/images/buttonImages/button2.png',
        '/static/images/buttonImages/button3.png',
        '/static/images/buttonImages/button4.png',
        '/static/images/buttonImages/button5.png',
        '/static/images/buttonImages/button6.png',
        '/static/images/buttonImages/button7.png',
        '/static/images/buttonImages/button8.png'
      ];

      let lastCollisionTime = 0;

      function getRandomButtonImage() {
        return buttonImages[Math.floor(Math.random() * buttonImages.length)];
      }

      function moveFloatingButton() {
        if (!isFloatingVisible) return;

        const now = Date.now();
        ({ maxX, maxY } = updateContainerDimensions());

        angle += (Math.random() - 0.5) * 0.1;
        posX += Math.cos(angle) * speed;
        posY += Math.sin(angle) * speed;

        // Boundary handling
        if (posX <= collisionMargin || posX >= maxX - collisionMargin ||
            posY <= collisionMargin || posY >= maxY - collisionMargin) {
          if (now - lastCollisionTime > collisionCooldown) {
            angle = Math.random() * 2 * Math.PI; // New random angle on collision
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            lastCollisionTime = now;
          }
          posX = Math.max(collisionMargin, Math.min(posX, maxX - collisionMargin));
          posY = Math.max(collisionMargin, Math.min(posY, maxY - collisionMargin));
        }

        floatingButton.style.transform = `translate(${posX}px, ${posY}px)`;

        requestAnimationFrame(moveFloatingButton);
      }

      floatingButton.style.position = 'absolute';
      floatingButton.style.width = `${buttonWidth}px`;
      floatingButton.style.height = `${buttonHeight}px`;
      floatingButton.style.backgroundSize = 'cover';

      requestAnimationFrame(moveFloatingButton);

      floatingButton.addEventListener('click', () => {
        window.location.href = '/CreateCharacter';
      });

      window.addEventListener('resize', updateContainerDimensions);

    }