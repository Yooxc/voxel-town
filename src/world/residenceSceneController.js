export function createResidenceSceneController(ctx) {
  function destroyRoom(roomKey) {
    const state = ctx.getState();
    const result = ctx.destroyRoomInstance({ roomKey, ...state });
    ctx.setState(result);
  }

  function createRoom(roomKey) {
    const result = ctx.createRoomInstance({ roomKey, ...ctx.getState() });
    ctx.setState(result);
    return result.instance;
  }

  return { destroyRoom, createRoom };
}
