export default (resize, event) => {
    if (resize) {
        process.stdout.on('resize', event);
        // keep the terminal session open
        setInterval(() => {}, 300);
    }
}