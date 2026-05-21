import { createElement } from 'react';
import type {
  ButtonHTMLAttributes,
  FormEventHandler,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

/** Minimal DOM stubs for tests — PascalCase exports; native tags via createElement (not JSX). */
export function StubForm({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return createElement('form', { onSubmit }, children);
}

export function StubInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return createElement('input', props);
}

export function StubTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return createElement('textarea', props);
}

export function StubLabel({
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { children?: ReactNode }) {
  return createElement('label', props, children);
}

export function StubButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return createElement('button', { type: 'button', ...props }, props.children);
}
