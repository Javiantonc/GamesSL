parts=['toon.js','items.js','monsters.js','village.js','prof.js','world.js','places.js','game.js','animals.js','gear.js','systems.js','abilities.js','mounts.js','main.js']
out=open('shell.html').read()+''.join(open(p).read()+"\n" for p in parts)+"</script>\n</body>\n</html>\n"
open('index.html','w').write(out)
