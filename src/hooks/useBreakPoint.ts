import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'
import { useScreenSize } from './useScreenSize';

const fullConfig = resolveConfig(tailwindConfig);
const screens = fullConfig.theme.screens;

type BreakpointKey = keyof typeof screens;
type TupleUnion<U extends string, R extends any[] = []> = {
    [S in U]: Exclude<U, S> extends never ? [...R, S] : TupleUnion<Exclude<U, S>, [...R, S]>;
}[U];
type Breakpoints = TupleUnion<BreakpointKey>;
const breakpoints: Breakpoints = ["sm", "md", "lg", "xl", "2xl"];


export function useBreakPoint(): BreakpointKey | undefined {
    const {width} = useScreenSize();

    const activeBreakpoint = breakpoints.find(breakpoint => {
        const target = parseInt(screens[breakpoint].replace("px", ""));
        return width >= target;
    });

    return activeBreakpoint;
}