let scene, camera, renderer, controls;
let window3D, axes;

// Инициализация сцены
function init() {
    // Создаем сцену
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Настраиваем камеру
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 2);

    // Создаем рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 300, window.innerHeight); // Учитываем ширину панели управления
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Добавляем освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Добавляем управление орбитой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Добавляем оси координат
    createAxes();

    // Создаем начальное окно
    createWindow();

    // Запускаем анимацию
    animate();
}

// Создание осей координат с подписями
function createAxes() {
    if (axes) {
        scene.remove(axes);
    }

    axes = new THREE.Group();

    // Создаем оси
    const axesHelper = new THREE.AxesHelper(2);
    axes.add(axesHelper);

    // Добавляем подписи к осям
    const createLabel = (text, position, color) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 32;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '24px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.5, 0.125, 1);
        return sprite;
    };

    // Добавляем подписи
    axes.add(createLabel('Ширина', new THREE.Vector3(2.2, 0, 0), '#ff0000'));
    axes.add(createLabel('Высота', new THREE.Vector3(0, 2.2, 0), '#00ff00'));
    axes.add(createLabel('Глубина', new THREE.Vector3(0, 0, 2.2), '#0000ff'));

    scene.add(axes);
}

// Создание 3D модели окна
function createWindow(params = {}) {
    // Удаляем предыдущее окно
    if (window3D) {
        scene.remove(window3D);
    }

    // Параметры окна по умолчанию
    const width = (params.width || 1000) / 1000; // Конвертируем мм в метры
    const height = (params.height || 1400) / 1000;
    const depth = (params.depth || 70) / 1000;
    const color = params.color || 0xffffff;

    window3D = new THREE.Group();

    // Создаем раму
    function createFrame(w, h, d, isFrame = true) {
        const frame = new THREE.Group();
        const profileWidth = isFrame ? 0.06 : 0.055; // 60mm для рамы, 55mm для створки
        const plateDepth = 0.002; // 2mm для пластины

        // Функция создания профиля с обрезкой 45 градусов
        function createProfile(length, isVertical) {
            const profile = new THREE.Group();
            const geometry = new THREE.BoxGeometry(isVertical ? profileWidth : length,
                                                 isVertical ? length : profileWidth,
                                                 d);
            const material = new THREE.MeshPhongMaterial({ color: color });
            const mesh = new THREE.Mesh(geometry, material);

            // Создаем обрезку под 45 градусов
            const matrix = new THREE.Matrix4();
            const angle = Math.PI / 4; // 45 градусов
            if (isVertical) {
                matrix.makeRotationX(angle);
            } else {
                matrix.makeRotationY(angle);
            }

            profile.add(mesh);
            return profile;
        }

        // Создаем горизонтальные профили
        const topProfile = createProfile(w, false);
        const bottomProfile = createProfile(w, false);
        topProfile.position.set(w/2, h - profileWidth/2, 0);
        bottomProfile.position.set(w/2, profileWidth/2, 0);

        // Создаем вертикальные профили
        const leftProfile = createProfile(h, true);
        const rightProfile = createProfile(h, true);
        leftProfile.position.set(profileWidth/2, h/2, 0);
        rightProfile.position.set(w - profileWidth/2, h/2, 0);

        // Создаем пластины в углах
        const corners = [
            { x: profileWidth, y: profileWidth },
            { x: w - profileWidth, y: profileWidth },
            { x: profileWidth, y: h - profileWidth },
            { x: w - profileWidth, y: h - profileWidth }
        ];

        corners.forEach(pos => {
            const plateGeometry = new THREE.BoxGeometry(0.03, 0.03, plateDepth);
            const plateMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const plate = new THREE.Mesh(plateGeometry, plateMaterial);
            plate.position.set(pos.x, pos.y, -plateDepth/2);
            frame.add(plate);
        });

        frame.add(topProfile);
        frame.add(bottomProfile);
        frame.add(leftProfile);
        frame.add(rightProfile);

        return frame;
    }

    // Создаем основную раму
    const mainFrame = createFrame(width, height, depth);
    window3D.add(mainFrame);

    // Создаем створку (немного меньше рамы)
    const sashWidth = width - 0.07; // На 70мм меньше
    const sashHeight = height - 0.07;
    const sashDepth = depth - 0.02; // На 20мм меньше глубина
    const sash = createFrame(sashWidth, sashHeight, sashDepth, false);
    sash.position.set(0.035, 0.035, 0.01); // Смещаем створку внутрь рамы
    window3D.add(sash);

    // Создаем стеклопакет
    const glassWidth = sashWidth - 0.08;
    const glassHeight = sashHeight - 0.08;
    const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, 0.024); // 24мм толщина стеклопакета
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.0,
        metalness: 0.0,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.9,
        thickness: 0.05
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(width/2, height/2, depth/2);
    window3D.add(glass);

    // Добавляем задний фон за стеклом для лучшей видимости прозрачности
    const backPlateGeometry = new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.001);
    const backPlateMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    const backPlate = new THREE.Mesh(backPlateGeometry, backPlateMaterial);
    backPlate.position.set(width/2, height/2, -0.05);
    window3D.add(backPlate);

    // Центрируем всё окно
    window3D.position.set(0, 0, 0);

    scene.add(window3D);
}

// Функция анимации
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth - 300) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 300, window.innerHeight);
});

// Загрузка данных и инициализация интерфейса
async function loadData() {
    try {
        // Загружаем бренды
        const brandsResponse = await fetch('/api/brands');
        const brands = await brandsResponse.json();
        
        // Загружаем цвета ламинации
        const colorsResponse = await fetch('/api/lamination-colors');
        const colors = await colorsResponse.json();

        // Заполняем селект брендов
        const brandSelect = document.getElementById('brand');
        Object.entries(brands).forEach(([id, brand]) => {
            const option = new Option(brand.name, id);
            brandSelect.add(option);
        });

        // Заполняем селект цветов
        const laminationSelect = document.getElementById('lamination');
        colors.forEach(color => {
            const option = new Option(color.name, color.id);
            option.style.backgroundColor = color.hex;
            laminationSelect.add(option);
        });

        // Обработчик выбора бренда
        brandSelect.addEventListener('change', () => {
            const modelSelect = document.getElementById('model');
            modelSelect.innerHTML = '<option value="">Выберите модель</option>';
            modelSelect.disabled = !brandSelect.value;

            if (brandSelect.value) {
                const brand = brands[brandSelect.value];
                brand.models.forEach(model => {
                    const option = new Option(model.name, model.id);
                    option.dataset.depth = model.depth;
                    modelSelect.add(option);
                });
            }
            updateWindow();
        });

        // Обработчики изменения параметров
        ['model', 'lamination', 'width', 'height'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateWindow);
        });
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Обновление 3D модели окна
function updateWindow() {
    const width = parseInt(document.getElementById('width').value) || 1000;
    const height = parseInt(document.getElementById('height').value) || 1400;
    const modelSelect = document.getElementById('model');
    const depth = modelSelect.selectedOptions[0]?.dataset.depth || 70;
    
    const laminationSelect = document.getElementById('lamination');
    const colors = {
        'white': 0xFFFFFF,
        'golden_oak': 0xB88A44,
        'mahogany': 0x4A0404,
        'walnut': 0x614126,
        'anthracite': 0x293133
    };
    const color = colors[laminationSelect.value] || 0xFFFFFF;

    createWindow({ width, height, depth, color });
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    init();
    loadData();
});
