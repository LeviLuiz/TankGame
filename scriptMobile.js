function isMobile() {
    return (
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
            navigator.userAgent,
        ) ||
        window.innerWidth <= 900 ||
        "ontouchstart" in window
    );
}

if (isMobile()) {
    focarPaisagem();

    linhas[1].children[1].style.display = "none";
    linhas[2].children[0].style.display = "none";
    linhas[1].style.height = "100dvh";

    document.getElementById("configScreen").children[4].style.display = "none";

    posicaobotx = window.innerWidth - 100;
    posicaoboty = 150;

    document.getElementById("botsConfig").max = 2;

    for (i = 1; i <= 4; i++) {
        tankTypes[i].speed /= 2;
        tankTypes[i].reload = Math.round(tankTypes[i].reload * 1.5);
    }
}