import { describe, expect, it } from "vitest";
import {
  challengeUrl,
  classifyArchiveGame,
  parseChessHandle,
  pliesFromFen,
  usernameFromApiUrl,
} from "./chesscom";

describe("chess.com helpers", () => {
  it("extracts usernames from player API urls", () => {
    expect(usernameFromApiUrl("https://api.chess.com/pub/player/Hikaru")).toBe("hikaru");
    expect(usernameFromApiUrl("https://api.chess.com/pub/player/gothamchess/")).toBe("gothamchess");
    expect(usernameFromApiUrl(undefined)).toBe("");
  });

  it("counts completed plies from a FEN", () => {
    // Start position: no moves played.
    expect(pliesFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(0);
    // After 1.e4: black to move, still move 1.
    expect(pliesFromFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1")).toBe(1);
    // After 1.e4 e5: white to move, move 2.
    expect(pliesFromFen("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2")).toBe(2);
    expect(pliesFromFen("garbage")).toBeUndefined();
    expect(pliesFromFen(undefined)).toBeUndefined();
  });

  it("classifies archive results", () => {
    expect(classifyArchiveGame({ white: { result: "win" }, black: { result: "resigned" } })).toBe("white");
    expect(classifyArchiveGame({ white: { result: "checkmated" }, black: { result: "win" } })).toBe("black");
    expect(classifyArchiveGame({ white: { result: "agreed" }, black: { result: "agreed" } })).toBe("draw");
    expect(classifyArchiveGame({ white: { result: "stalemate" }, black: { result: "stalemate" } })).toBe("draw");
    expect(classifyArchiveGame({ white: { result: "aborted" }, black: { result: "aborted" } })).toBeNull();
    expect(classifyArchiveGame({})).toBeNull();
  });

  it("parses handles from usernames, @handles and profile links", () => {
    expect(parseChessHandle("hikaru")).toBe("hikaru");
    expect(parseChessHandle("@hikaru")).toBe("hikaru");
    expect(parseChessHandle("https://www.chess.com/member/hikaru")).toBe("hikaru");
    expect(parseChessHandle("chess.com/member/GothamChess?tab=stats")).toBe("GothamChess");
  });

  it("builds challenge links", () => {
    expect(challengeUrl("Hikaru")).toBe("https://www.chess.com/play/online/new?opponent=hikaru");
    expect(challengeUrl(undefined)).toBeUndefined();
  });
});
