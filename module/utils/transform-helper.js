
  export default async function transform() {

    if (canvas.tokens.controlled.length == 0 || canvas.tokens.controlled.length > 1) {
        ui.notifications.warn("Please select a single token.");
        return;
    }

    const selectedActor = canvas.tokens.controlled[0].actor;
    const transformingToken = selectedActor.getActiveTokens()[0];

    const alreadyTransformed = selectedActor.effects.find(effect => effect.label == "Transform");

    if (!alreadyTransformed){

      //change from origonal pokemon to target
      const targets = [...game.user.targets];
      if (targets.length != 1) {
          ui.notifications.warn("Unable to transform - Please target a single target.");
          return;
      }

      //this will be added to the actors moves to enable them to transform back
      const transformMove = selectedActor.items.find(item => item.name.toLowerCase() == "transform");

      const oldData = {
        ['flags.ptu.initialItems']: selectedActor.items.filter(item => item.type === "move" || item.type === "ability" || item.type === "capability" ),
        ['flags.ptu.initialImage']: selectedActor.img,
        ['flags.ptu.initialSize']: selectedActor.prototypeToken.height
      }

      await selectedActor.update(oldData);

      const targetActor = targets[0].actor;

      const targetItems = [...targetActor.items.filter(item => item.type === "move" || item.type === "ability" || item.type === "capability" ), transformMove];

      //update token
      const updates = {
        _id: transformingToken.id,
        height: targetActor.prototypeToken.height,
        width: targetActor.prototypeToken.width,
        img: targetActor.img
      };

      await transformingToken.document.update(updates);
      //update capabilities of selectedActor
      //selectedActor.capabilities = targetCapabilites;
      //delete all current moves and abiltites

      await selectedActor.deleteEmbeddedDocuments("Item", selectedActor.items.filter(item => item.type === "move" || item.type === "ability" || item.type === "capability").map(item => item.id));

      //add new moves and abilities
      await selectedActor.createEmbeddedDocuments("Item", duplicate(targetItems))
      //add effects to change capabilities
      const TransformEffect = {
          "changes": [
              { key: "system.capabilities.Burrow", mode: 5, value: targetActor.system.capabilities["Burrow"], priority: 69 },
              { key: "system.capabilities.High Jump", mode: 5, value: targetActor.system.capabilities["High Jump"], priority: 69 },
              { key: "system.capabilities.Levitate", mode: 5, value: targetActor.system.capabilities["Levitate"], priority: 69 },
              { key: "system.capabilities.Long Jump", mode: 5, value: targetActor.system.capabilities["Long Jump"], priority: 69 },
              { key: "system.capabilities.Naturewalk", mode: 5, value: targetActor.system.capabilities["Naturewalk"], priority: 69 },
              { key: "system.capabilities.Overland", mode: 5, value: targetActor.system.capabilities["Overland"], priority: 69 },
              { key: "system.capabilities.Power", mode: 5, value: targetActor.system.capabilities["Power"], priority: 69 },
              { key: "system.capabilities.Sky", mode: 5, value: targetActor.system.capabilities["Sky"], priority: 69 },
              { key: "system.capabilities.Swim", mode: 5, value: targetActor.system.capabilities["Swim"], priority: 69 },        
          ],
          "label": "Transform"
      }
      await selectedActor.createEmbeddedDocuments("ActiveEffect", [TransformEffect]);

    } else {
        //change back to initial mon
        const initialItems = selectedActor.getFlag('ptu', 'initialItems');
        const initialImage = selectedActor.getFlag('ptu', 'initialImage');
        const initialSize = selectedActor.getFlag('ptu', 'initialSize');

        //remove flags
        await selectedActor.update({'flags.ptu.-=initialItems': false,
          'flags.ptu.-=initialImage': false,
          'flags.ptu.-=initialSize': false
        });

        //update token
        await transformingToken.document.update({_id: transformingToken.id,
          height: initialSize,
          width: initialSize,
          img: initialImage
        });
        //delete all current moves and abiltites
        await selectedActor.deleteEmbeddedDocuments("Item", selectedActor.items.filter(item => item.type === "move" || item.type === "ability" || item.type === "capability").map(item => item.id));

        //add old moves and abilities
        await selectedActor.createEmbeddedDocuments("Item", duplicate(initialItems))
        //remove effects to change capabilities
        await selectedActor.deleteEmbeddedDocuments("ActiveEffect", selectedActor.effects.filter(e => e.label.toLowerCase() === "transform").map(e => e.id));
    }
  }